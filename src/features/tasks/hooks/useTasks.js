import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { taskApi } from '../api/taskApi';
import { getSocket } from '@/api/socketClient';
import { toastSuccess, toastError } from '@/lib/toast';

const BOARD_KEY = 'task-board';
const TASK_KEY = 'task';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Coalesce rapid assignee toggles into one PATCH per task */
const assigneeDebounceWaiters = new Map();
const assigneeDebounceTimers = new Map();

function makeSupersededError() {
  const err = new Error('assignee-update-superseded');
  err.isSuperseded = true;
  err.silent = true;
  return err;
}

function debounceAssigneeUpdate(taskId, buildRequest) {
  const key = String(taskId);
  return new Promise((resolve, reject) => {
    const existing = assigneeDebounceWaiters.get(key);
    if (existing) {
      // Drop older in-flight mutate() calls without rolling UI back
      existing.rejecters.forEach((r) => r(makeSupersededError()));
    }

    assigneeDebounceWaiters.set(key, {
      resolvers: [resolve],
      rejecters: [reject],
      buildRequest,
    });

    const prevTimer = assigneeDebounceTimers.get(key);
    if (prevTimer) clearTimeout(prevTimer);

    assigneeDebounceTimers.set(
      key,
      setTimeout(async () => {
        const batch = assigneeDebounceWaiters.get(key);
        assigneeDebounceWaiters.delete(key);
        assigneeDebounceTimers.delete(key);
        if (!batch?.buildRequest) return;
        try {
          const result = await batch.buildRequest();
          batch.resolvers.forEach((r) => r(result));
        } catch (err) {
          batch.rejecters.forEach((r) => r(err));
        }
      }, 450)
    );
  });
}

async function patchTaskWithRetry(id, body, { retries = 2 } = {}) {
  try {
    return await taskApi.update(id, body);
  } catch (error) {
    const status = error?.response?.status;
    if (status === 429 && retries > 0) {
      await sleep(700 * (3 - retries));
      return patchTaskWithRetry(id, body, { retries: retries - 1 });
    }
    throw error;
  }
}

function collectPeopleMap(queryClient, previousAssignees = []) {
  const map = new Map();
  for (const a of previousAssignees || []) {
    const id = String(a?._id || a);
    if (id) map.set(id, typeof a === 'object' ? a : { _id: id });
  }

  for (const [, data] of queryClient.getQueriesData({ queryKey: ['users'] })) {
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    for (const u of list) {
      if (u?._id) map.set(String(u._id), u);
    }
  }

  for (const [, board] of queryClient.getQueriesData({ queryKey: [BOARD_KEY] })) {
    if (!board || typeof board !== 'object') continue;
    for (const col of Object.values(board)) {
      if (!Array.isArray(col)) continue;
      for (const task of col) {
        for (const a of task?.assignees || []) {
          const id = String(a?._id || a);
          if (id && typeof a === 'object') map.set(id, a);
        }
      }
    }
  }

  for (const [, task] of queryClient.getQueriesData({ queryKey: [TASK_KEY] })) {
    if (!task || typeof task !== 'object' || Array.isArray(task)) continue;
    for (const a of task.assignees || []) {
      const id = String(a?._id || a);
      if (id && typeof a === 'object') map.set(id, a);
    }
  }

  return map;
}

function resolveAssignees(payloadAssignees, previousAssignees, queryClient) {
  if (!Array.isArray(payloadAssignees)) return undefined;
  const people = collectPeopleMap(queryClient, previousAssignees);
  return payloadAssignees.map((a) => {
    if (a && typeof a === 'object' && (a.name || a.email)) return a;
    const sid = String(a?._id || a);
    return people.get(sid) || { _id: sid, name: 'Updating…' };
  });
}

function applyTaskPatch(existing, payload, queryClient) {
  if (!existing) return existing;
  const patched = { ...existing, ...payload, updatedAt: new Date().toISOString() };
  if (Array.isArray(payload.assignees)) {
    patched.assignees = resolveAssignees(payload.assignees, existing.assignees, queryClient);
  }
  return patched;
}

function patchBoardTask(previousBoard, id, payload, queryClient) {
  if (!previousBoard) return previousBoard;

  let found = null;
  let fromStatus = null;
  for (const col of Object.keys(previousBoard)) {
    if (!Array.isArray(previousBoard[col])) continue;
    const task = previousBoard[col].find((t) => String(t._id) === String(id));
    if (task) {
      found = task;
      fromStatus = col;
      break;
    }
  }
  if (!found) return previousBoard;

  const patched = applyTaskPatch(found, payload, queryClient);
  const toStatus =
    payload.status && previousBoard[payload.status] != null ? payload.status : fromStatus;

  const next = { ...previousBoard };
  for (const col of Object.keys(next)) {
    if (!Array.isArray(next[col])) continue;
    next[col] = next[col].filter((t) => String(t._id) !== String(id));
  }
  next[toStatus] = [...(next[toStatus] || []), { ...patched, status: toStatus }];
  return next;
}

export function useTaskBoard(projectId) {
  return useQuery({
    queryKey: [BOARD_KEY, projectId],
    queryFn: () => taskApi.getBoard(projectId),
    enabled: Boolean(projectId),
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: [TASK_KEY, id],
    queryFn: () => taskApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useTaskSubtasks(id) {
  return useQuery({
    queryKey: [TASK_KEY, id, 'subtasks'],
    queryFn: () => taskApi.getSubtasks(id),
    enabled: Boolean(id),
  });
}

export function useTaskActivity(id) {
  return useQuery({
    queryKey: [TASK_KEY, id, 'activity'],
    queryFn: () => taskApi.getActivity(id),
    enabled: Boolean(id),
  });
}

export function useCreateTask(projectId) {
  const queryClient = useQueryClient();
  const boardKey = [BOARD_KEY, projectId];

  return useMutation({
    mutationFn: taskApi.create,
    onSuccess: (task) => {
      if (projectId && task) {
        queryClient.setQueryData(boardKey, (prev) => {
          if (!prev) return prev;
          const status = task.status || 'todo';
          const next = { ...prev };
          const col = [...(next[status] || [])];
          if (!col.some((t) => String(t._id) === String(task._id))) {
            col.unshift(task);
          }
          next[status] = col;

          const parentId = task.parentTask?._id || task.parentTask;
          if (parentId) {
            for (const key of Object.keys(next)) {
              if (!Array.isArray(next[key])) continue;
              next[key] = next[key].map((t) =>
                String(t._id) === String(parentId)
                  ? { ...t, subtaskCount: (t.subtaskCount || 0) + 1 }
                  : t
              );
            }
            queryClient.invalidateQueries({ queryKey: [TASK_KEY, String(parentId), 'subtasks'] });
          }
          return next;
        });
      }
      queryClient.invalidateQueries({ queryKey: boardKey });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toastSuccess(task?.parentTask ? 'Subtask created' : 'Task created');
    },
    onError: (error) => {
      toastError(error, 'Failed to create task');
    },
  });
}

export function useAdvanceTask(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => taskApi.advanceOrUpdate(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, variables.id, 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toastSuccess('Moved to next workflow step');
    },
    onError: (error) => {
      toastError(error, 'Could not advance task');
    },
  });
}

export function useUpdateTask(projectId, { silent = false } = {}) {
  const queryClient = useQueryClient();
  const boardKey = [BOARD_KEY, projectId];
  const taskKey = (id) => [TASK_KEY, id];

  return useMutation({
    mutationFn: ({ id, payload }) => {
      const body = { ...payload };
      // API expects assignee ObjectIds only
      if (Array.isArray(body.assignees)) {
        body.assignees = body.assignees.map((a) => String(a?._id || a));
      }

      const keys = Object.keys(body);
      const assigneeOnly = keys.length === 1 && Array.isArray(body.assignees);

      // Rapid assignee clicks → one network request after a short pause
      if (assigneeOnly) {
        return debounceAssigneeUpdate(id, () => patchTaskWithRetry(id, body));
      }

      return patchTaskWithRetry(id, body);
    },

    onMutate: async ({ id, payload, optimistic }) => {
      const detailKey = taskKey(id);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: boardKey }),
        queryClient.cancelQueries({ queryKey: detailKey }),
      ]);

      const previousBoard = projectId ? queryClient.getQueryData(boardKey) : undefined;
      const previousTask = queryClient.getQueryData(detailKey);

      // Prefer optimistic display patch (full assignee objects) when provided
      const displayPayload = optimistic ? { ...payload, ...optimistic } : payload;

      if (previousTask && displayPayload) {
        queryClient.setQueryData(
          detailKey,
          applyTaskPatch(previousTask, displayPayload, queryClient)
        );
      }

      if (previousBoard && displayPayload) {
        queryClient.setQueryData(
          boardKey,
          patchBoardTask(previousBoard, id, displayPayload, queryClient)
        );
      }

      return { previousBoard, previousTask, detailKey, payload };
    },

    onError: (error, variables, context) => {
      // Older assignee clicks replaced by a newer one — keep optimistic UI
      if (error?.isSuperseded || error?.silent) return;

      if (context?.previousBoard && projectId) {
        queryClient.setQueryData(boardKey, context.previousBoard);
      }
      if (context?.previousTask && context?.detailKey) {
        queryClient.setQueryData(context.detailKey, context.previousTask);
      }

      const status = error?.response?.status;
      if (status === 429) {
        toastError('Please wait a moment, then try again');
        return;
      }

      const data = error?.response?.data;
      const details = data?.errors?.map((err) => err.message).filter(Boolean).join(', ');
      toastError(details || data?.message || 'Failed to update task');
    },

    onSuccess: (data, variables) => {
      // Apply server truth immediately — no waiting on refetch
      if (data) {
        queryClient.setQueryData(taskKey(variables.id), (prev) =>
          prev ? { ...prev, ...data } : data
        );
        if (projectId) {
          queryClient.setQueryData(boardKey, (prev) =>
            patchBoardTask(prev, variables.id, data, queryClient)
          );
        }
      }

      // Background reconcile only (UI already updated)
      queryClient.invalidateQueries({
        queryKey: [TASK_KEY, variables.id, 'activity'],
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['home'], refetchType: 'none' });
      if (!silent) toastSuccess('Task updated');
    },
  });
}

export function useMoveTask(projectId) {
  const queryClient = useQueryClient();
  const boardKey = [BOARD_KEY, projectId];

  return useMutation({
    mutationFn: ({ id, status, position }) => taskApi.move(id, { status, position }),

    onMutate: async ({ id, status, position }) => {
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previousBoard = queryClient.getQueryData(boardKey);

      if (previousBoard) {
        const next = { ...previousBoard };
        for (const col of Object.keys(next)) {
          if (!Array.isArray(next[col])) continue;
          next[col] = next[col].filter((t) => String(t._id) !== String(id));
        }
        const movedTask = Object.values(previousBoard)
          .flat()
          .find((t) => String(t._id) === String(id));
        if (movedTask) {
          const column = [...(next[status] || [])];
          const insertAt = Math.max(0, Math.min(Number(position) || 0, column.length));
          column.splice(insertAt, 0, { ...movedTask, status, position: insertAt });
          next[status] = column.map((t, index) => ({ ...t, position: index }));
        }
        queryClient.setQueryData(boardKey, next);
      }

      queryClient.setQueryData([TASK_KEY, id], (prev) =>
        prev ? { ...prev, status, position } : prev
      );

      return { previousBoard };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKey, context.previousBoard);
      }
      toastError('Failed to move task');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKey, refetchType: 'active' });
    },
  });
}

export function useDeleteTask(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toastSuccess('Task deleted');
    },
    onError: (error) => {
      toastError(error, 'Failed to delete task');
    },
  });
}

export function useUploadTaskAttachment(taskId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => taskApi.uploadAttachment(taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, taskId] });
      toastSuccess('File uploaded');
    },
    onError: () => toastError('Upload failed'),
  });
}

export function usePendingApprovals(enabled = true) {
  return useQuery({
    queryKey: ['task-approvals-pending'],
    queryFn: taskApi.getPendingApprovals,
    enabled,
  });
}

export function useApproveTask(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => taskApi.approve(id, reason ? { reason } : {}),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['task-approvals-pending'] });
      toastSuccess('Task approved');
    },
    onError: (error) => {
      toastError(error, 'Failed to approve task');
    },
  });
}

export function useRejectTask(projectId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => taskApi.reject(id, { reason }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['task-approvals-pending'] });
      toastSuccess('Task rejected');
    },
    onError: (error) => {
      toastError(error, 'Failed to reject task');
    },
  });
}

/** Approve/reject from Approvals page (no project context) */
export function useApproveTaskGlobal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => taskApi.approve(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY] });
      queryClient.invalidateQueries({ queryKey: ['task-approvals-pending'] });
      toastSuccess('Task approved');
    },
    onError: (error) => {
      toastError(error, 'Failed to approve task');
    },
  });
}

export function useRejectTaskGlobal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => taskApi.reject(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY] });
      queryClient.invalidateQueries({ queryKey: ['task-approvals-pending'] });
      toastSuccess('Task rejected');
    },
    onError: (error) => {
      toastError(error, 'Failed to reject task');
    },
  });
}

/** Real-time Space board/list — join project room and patch cache on task events */
export function useLiveProjectBoard(projectId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    socket.emit('project:join', projectId);
    const boardKey = [BOARD_KEY, projectId];
    /** Dedupe identical socket payloads (room + broadcast) */
    const seen = new Map();
    const remember = (key) => {
      const now = Date.now();
      if (seen.has(key) && now - seen.get(key) < 800) return true;
      seen.set(key, now);
      if (seen.size > 200) {
        for (const [k, t] of seen) {
          if (now - t > 2000) seen.delete(k);
        }
      }
      return false;
    };

    const softRefreshMeta = () => {
      queryClient.invalidateQueries({ queryKey: ['projects'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['home'], refetchType: 'none' });
    };

    const patchFromTask = (task) => {
      if (!task?._id) return false;

      queryClient.setQueryData([TASK_KEY, task._id], (prev) =>
        prev ? { ...prev, ...task } : task
      );

      const previousBoard = queryClient.getQueryData(boardKey);
      if (!previousBoard) return false;

      const next = patchBoardTask(previousBoard, task._id, task, queryClient);
      queryClient.setQueryData(boardKey, next);
      return true;
    };

    const onCreated = (task) => {
      if (!task?._id) {
        queryClient.invalidateQueries({ queryKey: boardKey, refetchType: 'active' });
        softRefreshMeta();
        return;
      }
      if (remember(`c:${task._id}`)) return;
      queryClient.setQueryData(boardKey, (prev) => {
        if (!prev) return prev;
        const status = task.status || 'todo';
        const next = { ...prev };
        const col = [...(next[status] || [])];
        if (!col.some((t) => String(t._id) === String(task._id))) {
          col.unshift(task);
        }
        next[status] = col;
        return next;
      });
      softRefreshMeta();
    };

    const onUpdated = (task) => {
      if (!task?._id) return;
      if (remember(`u:${task._id}:${task.updatedAt || task.status || ''}`)) return;
      const patched = patchFromTask(task);
      if (!patched) {
        queryClient.invalidateQueries({ queryKey: boardKey, refetchType: 'active' });
      }
      softRefreshMeta();
    };

    const onDeleted = (payload) => {
      const id = payload?.taskId || payload?._id || payload?.task?._id;
      if (!id) {
        queryClient.invalidateQueries({ queryKey: boardKey, refetchType: 'active' });
        return;
      }
      if (remember(`d:${id}`)) return;
      queryClient.setQueryData(boardKey, (prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        for (const col of Object.keys(next)) {
          if (!Array.isArray(next[col])) continue;
          next[col] = next[col].filter((t) => String(t._id) !== String(id));
        }
        return next;
      });
      queryClient.removeQueries({ queryKey: [TASK_KEY, id] });
      softRefreshMeta();
    };

    /** Single entry point — avoids double-apply from task:created + task:changed */
    const onChanged = (payload) => {
      const event = payload?.event || '';
      const task = payload?.task || payload;
      if (event.includes('deleted') || payload?.taskId) {
        onDeleted(payload?.taskId ? payload : { task });
        return;
      }
      if (event.includes('created')) {
        onCreated(task);
        return;
      }
      onUpdated(task);
    };

    socket.on('task:changed', onChanged);
    socket.on('project:updated', () => {
      queryClient.invalidateQueries({ queryKey: boardKey, refetchType: 'active' });
      softRefreshMeta();
    });

    return () => {
      socket.emit('project:leave', projectId);
      socket.off('task:changed', onChanged);
      socket.off('project:updated');
    };
  }, [projectId, queryClient]);
}
