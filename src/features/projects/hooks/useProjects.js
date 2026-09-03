import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { projectApi } from '../api/projectApi';
import { getSocket } from '@/api/socketClient';

const KEY = 'projects';

export function useProjects(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => projectApi.list(params),
    staleTime: 45_000,
    placeholderData: keepPreviousData,
  });
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

/** Live sidebar + list refresh when spaces/projects/team access change */
export function useLiveSpaces() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    };

    socket.on('project:created', refresh);
    socket.on('project:updated', refresh);
    socket.on('project:deleted', refresh);
    socket.on('projects:counts', refresh);
    socket.on('team:member-added', refresh);
    socket.on('team:member-removed', refresh);
    return () => {
      socket.off('project:created', refresh);
      socket.off('project:updated', refresh);
      socket.off('project:deleted', refresh);
      socket.off('projects:counts', refresh);
      socket.off('team:member-added', refresh);
      socket.off('team:member-removed', refresh);
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
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success(variables?.successMessage || 'Project updated');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to update project');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success('Project deleted');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to delete project');
    },
  });
}

export function useArchiveProject() {
  const update = useUpdateProject();
  return {
    ...update,
    mutate: (id, options) =>
      update.mutate({ id, payload: { status: 'archived' } }, options),
    mutateAsync: (id) => update.mutateAsync({ id, payload: { status: 'archived' } }),
  };
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }) => projectApi.addMember(id, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['chat-project', variables.id] });
      toast.success('Person added to this project');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Could not add person');
    },
  });
}
