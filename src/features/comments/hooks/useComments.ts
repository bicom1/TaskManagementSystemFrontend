import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentApi } from '../api/commentApi';

const KEY = 'comments';

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: [KEY, taskId],
    queryFn: () => commentApi.listByTask(taskId),
    enabled: Boolean(taskId),
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; mentions?: string[] }) =>
      commentApi.create({ taskId, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, taskId] });
    },
    onError: () => toast.error('Failed to post comment'),
  });
}

export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => commentApi.update(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, taskId] }),
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, taskId] }),
  });
}
