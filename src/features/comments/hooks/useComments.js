import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { commentApi } from '../api/commentApi';

const KEY = 'comments';

export function useTaskComments(taskId) {
  return useQuery({
    queryKey: [KEY, taskId],
    queryFn: () => commentApi.listByTask(taskId),
    enabled: Boolean(taskId),
  });
}

export function useCreateComment(taskId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => commentApi.create({ taskId, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, taskId] });
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || 'Failed to post comment'),
  });
}

export function useUpdateComment(taskId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }) => commentApi.update(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, taskId] }),
  });
}

export function useDeleteComment(taskId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, taskId] }),
  });
}
