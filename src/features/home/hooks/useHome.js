import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { homeApi } from '../api/homeApi';

const KEY = 'home';

export function useHomeOverview() {
  return useQuery({
    queryKey: [KEY, 'overview'],
    queryFn: homeApi.overview,
    staleTime: 15_000,
  });
}

export function useMyTasks(view) {
  return useQuery({
    queryKey: [KEY, 'my-tasks', view],
    queryFn: () => homeApi.myTasks(view),
    enabled: Boolean(view),
  });
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
