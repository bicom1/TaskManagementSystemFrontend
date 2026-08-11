import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { taskApi, type BoardColumns, type Task, type TaskStatus } from '../api/taskApi';

const BOARD_KEY = 'task-board';
const TASK_KEY = 'task';

export function useTaskBoard(projectId: string) {
  return useQuery({
    queryKey: [BOARD_KEY, projectId],
    queryFn: () => taskApi.getBoard(projectId),
    enabled: Boolean(projectId),
  });
}

export function useTask(id: string) {
  return useQuery({ queryKey: [TASK_KEY, id], queryFn: () => taskApi.getById(id), enabled: Boolean(id) });
}

export function useTaskSubtasks(id: string) {
  return useQuery({
    queryKey: [TASK_KEY, id, 'subtasks'],
    queryFn: () => taskApi.getSubtasks(id),
    enabled: Boolean(id),
  });
}

export function useTaskActivity(id: string) {
  return useQuery({
    queryKey: [TASK_KEY, id, 'activity'],
    queryFn: () => taskApi.getActivity(id),
    enabled: Boolean(id),
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY, projectId] });
      toast.success('Task created');
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Task> }) => taskApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, variables.id] });
    },
  });
}

/**
 * Drag-and-drop move. Updates the board cache immediately (before the
 * network call resolves) so the card doesn't snap back during the
 * request, then rolls back on failure and reconciles with the server
 * response on success.
 */
export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  const boardKey = [BOARD_KEY, projectId];

  return useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: TaskStatus; position: number }) =>
      taskApi.move(id, { status, position }),

    onMutate: async ({ id, status, position }) => {
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previousBoard = queryClient.getQueryData<BoardColumns>(boardKey);

      if (previousBoard) {
        const next: BoardColumns = { ...previousBoard };
        for (const col of Object.keys(next) as TaskStatus[]) {
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

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_KEY, projectId] });
      toast.success('Task deleted');
    },
  });
}

export function useUploadTaskAttachment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => taskApi.uploadAttachment(taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASK_KEY, taskId] });
      toast.success('File uploaded');
    },
    onError: () => toast.error('Upload failed'),
  });
}
