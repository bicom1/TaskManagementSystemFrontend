import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { projectApi } from '../api/projectApi';
import { getSocket } from '@/api/socketClient';

const KEY = 'projects';

export function useProjects(params) {
  return useQuery({ queryKey: [KEY, params], queryFn: () => projectApi.list(params) });
}

export function useProject(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => projectApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Created successfully');
    },
    onError: (error) => {
      const data = error?.response?.data;
      const details = data?.errors?.map((err) => err.message).filter(Boolean).join(', ');
      toast.error(details || data?.message || 'Failed to create');
    },
  });
}

/** Live sidebar + list refresh when spaces/projects change */
export function useLiveSpaces() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
    };

    socket.on('project:created', refresh);
    socket.on('project:updated', refresh);
    socket.on('projects:counts', refresh);
    return () => {
      socket.off('project:created', refresh);
      socket.off('project:updated', refresh);
      socket.off('projects:counts', refresh);
    };
  }, [queryClient]);
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => projectApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.id] });
    },
  });
}
