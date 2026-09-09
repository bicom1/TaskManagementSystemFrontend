import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { projectApi } from '../api/projectApi';
import { getSocket } from '@/api/socketClient';
import { toastSuccess, toastError } from '@/lib/toast';

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
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      // Single source of truth for the success toast — callers must not add their
      // own, or one create shows two toasts.
      toastSuccess(created?.name ? `“${created.name}” created` : 'Created successfully');
    },
    onError: (error) => {
      toastError(error, 'Failed to create');
    },
  });
}

/** Live sidebar + list refresh when spaces/projects/team access change.
 * Mount once in AppShell. Debounced to avoid duplicate room+broadcast storms. */
export function useLiveSpaces() {
  const queryClient = useQueryClient();
  const timerRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const refresh = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [KEY] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
        queryClient.invalidateQueries({ queryKey: ['teams'] });
      }, 250);
    };

    socket.on('project:created', refresh);
    socket.on('project:updated', refresh);
    socket.on('project:deleted', refresh);
    socket.on('projects:counts', refresh);
    socket.on('team:member-added', refresh);
    socket.on('team:member-removed', refresh);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
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
      toastSuccess(variables?.successMessage || 'Project updated');
    },
    onError: (error) => {
      toastError(error, 'Failed to update project');
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.delete,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const name = data?.name ? `"${data.name}"` : 'Project';
      toastSuccess(`Project ${name} deleted`);
    },
    onError: (error) => {
      toastError(error, 'Failed to delete project');
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
      toastSuccess('Person added to this project');
    },
    onError: (error) => {
      toastError(error, 'Could not add person');
    },
  });
}
