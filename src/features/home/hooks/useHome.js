import { useEffect } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { homeApi } from '../api/homeApi';
import { getSocket } from '@/api/socketClient';
import { useAuthStore } from '@/store/authStore';

const KEY = 'home';

export function useHomeOverview() {
  return useQuery({
    queryKey: [KEY, 'overview'],
    queryFn: homeApi.overview,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useMyTasks(view) {
  return useQuery({
    queryKey: [KEY, 'my-tasks', view],
    queryFn: () => homeApi.myTasks(view),
    enabled: Boolean(view),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/** Keep My Tasks / Home assigned lists fresh when someone assigns you work */
export function useLiveMyTasks() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return undefined;
    const socket = getSocket();
    if (!socket) return undefined;

    const refreshMine = () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
    };

    socket.on('task:assigned', refreshMine);
    socket.on('task:changed', refreshMine);
    socket.on('task:created', refreshMine);
    socket.on('task:updated', refreshMine);
    socket.on('projects:counts', refreshMine);

    return () => {
      socket.off('task:assigned', refreshMine);
      socket.off('task:changed', refreshMine);
      socket.off('task:created', refreshMine);
      socket.off('task:updated', refreshMine);
      socket.off('projects:counts', refreshMine);
    };
  }, [queryClient, token]);
}

export function useUpdateHomePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: homeApi.updatePreferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success('Preferences updated');
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Failed to update cards'),
  });
}

export function usePersonalListMutations() {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: homeApi.addPersonal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success('Added to Personal List');
    },
  });
  const remove = useMutation({
    mutationFn: homeApi.removePersonal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      toast.success('Removed from Personal List');
    },
  });
  return { add, remove };
}

export function useTrackRecent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: homeApi.trackRecent,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'overview'] }),
  });
}
