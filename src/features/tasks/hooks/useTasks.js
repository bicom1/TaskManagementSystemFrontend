import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { taskApi } from '../api/taskApi';
import { getSocket } from '@/api/socketClient';

const BOARD_KEY = 'task-board';
const TASK_KEY = 'task';

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
          return next;
        });
      }
      queryClient.invalidateQueries({ queryKey: boardKey });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success('Task created');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create task');
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
      toast.success('Moved to next workflow step');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Could not advance task');
    },
  });
}

export function useUpdateTask(projectId, { silent = false } = {}) {
  const queryClient = useQueryClient();
  const boardKey = [BOARD_KEY, projectId];

  return useMutation({
    mutationFn: ({ id, payload }) => taskApi.update(id, payload),

    onMutate: async ({ id, payload }) => {
      if (!projectId) return {};
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previousBoard = queryClient.getQueryData(boardKey);
      if (previousBoard && payload) {
        const next = { ...previousBoard };
        for (const col of Object.keys(next)) {
          if (!Array.isArray(next[col])) continue;
          next[col] = next[col].map((task) => {
            if (String(task._id) !== String(id)) return task;
            const patched = { ...task, ...payload };
            // Keep assignee objects when payload only has ids
            if (Array.isArray(payload.assignees)) {
              const prevMap = new Map(
                (task.assignees || []).map((a) => [String(a._id || a), a])
              );
              patched.assignees = payload.assignees.map((a) => {
                if (a && typeof a === 'object') return a;
                const sid = String(a);
                return prevMap.get(sid) || { _id: sid, name: 'User' };
              });
            }
            return patched;
          });
        }
        queryClient.setQueryData(boardKey, next);
      }
      return { previousBoard };
    },

    onError: (error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKey, context.previousBoard);
      }
      const data = error?.response?.data;
      const details = data?.errors?.map((err) => err.message).filter(Boolean).join(', ');
      toast.error(details || data?.message || 'Failed to update task');
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKey });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, variables.id, 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      if (!silent) toast.success('Task updated');
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
          next[col] = next[col].filter((t) => t._id !== id);
        }
        const movedTask = Object.values(previousBoard)
          .flat()
          .find((t) => t._id === id);
        if (movedTask) {
          next[status] = [...next[status], { ...movedTask, status, position }].sort(
            (a, b) => a.position - b.position
          );
        }
        queryClient.setQueryData(boardKey, next);
      }

      return { previousBoard };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardKey, context.previousBoard);
      }
      toast.error('Failed to move task');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKey });
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
      toast.success('Task deleted');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to delete task');
    },
  });
}

export function useUploadTaskAttachment(taskId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => taskApi.uploadAttachment(taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, taskId] });
      toast.success('File uploaded');
    },
    onError: () => toast.error('Upload failed'),
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
      toast.success('Task approved');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to approve task');
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
      toast.success('Task rejected');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to reject task');
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
      toast.success('Task approved');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to approve task');
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
      toast.success('Task rejected');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to reject task');
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

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: boardKey });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    };

    const patchFromTask = (task) => {
      if (!task?._id) {
        refresh();
        return;
      }
      const previousBoard = queryClient.getQueryData(boardKey);
      if (!previousBoard) {
        refresh();
        return;
      }
      const next = { ...previousBoard };
      let found = false;
      for (const col of Object.keys(next)) {
        if (!Array.isArray(next[col])) continue;
        next[col] = next[col].map((t) => {
          if (String(t._id) !== String(task._id)) return t;
          found = true;
          return { ...t, ...task };
        });
      }
      // Status moved columns
      if (found && task.status && previousBoard[task.status]) {
        const cleaned = {};
        for (const col of Object.keys(next)) {
          cleaned[col] = (next[col] || []).filter((t) => String(t._id) !== String(task._id));
        }
        cleaned[task.status] = [...(cleaned[task.status] || []), { ...task }];
        queryClient.setQueryData(boardKey, cleaned);
      } else if (found) {
        queryClient.setQueryData(boardKey, next);
      } else {
        refresh();
      }
    };

    const onUpdated = (payload) => {
      const task = payload?.task || payload;
      patchFromTask(task);
      refresh();
    };

    socket.on('task:changed', onUpdated);
    socket.on('task:created', refresh);
    socket.on('task:updated', onUpdated);
    socket.on('task:moved', refresh);
    socket.on('task:deleted', refresh);
    socket.on('project:updated', refresh);

    return () => {
      socket.emit('project:leave', projectId);
      socket.off('task:changed', onUpdated);
      socket.off('task:created', refresh);
      socket.off('task:updated', onUpdated);
      socket.off('task:moved', refresh);
      socket.off('task:deleted', refresh);
      socket.off('project:updated', refresh);
    };
  }, [projectId, queryClient]);
}
