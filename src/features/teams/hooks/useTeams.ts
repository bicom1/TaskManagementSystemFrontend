import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teamApi } from '../api/teamApi';

const KEY = 'teams';

function removeTeamFromCaches(queryClient: ReturnType<typeof useQueryClient>, teamId: string) {
  const id = String(teamId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old: unknown) => {
    if (!old) return old;
    if (typeof old === 'object' && old !== null && Array.isArray((old as { data?: unknown }).data)) {
      const typed = old as { data: Array<{ _id: string }>; pagination?: { total?: number } };
      return {
        ...typed,
        data: typed.data.filter((t) => String(t._id) !== id),
        pagination: typed.pagination
          ? {
              ...typed.pagination,
              total: Math.max(0, (typed.pagination.total || 0) - 1),
            }
          : typed.pagination,
      };
    }
    if (Array.isArray(old)) {
      return old.filter((t: { _id: string }) => String(t._id) !== id);
    }
    return old;
  });
  queryClient.removeQueries({ queryKey: [KEY, teamId] });
}

function patchTeamInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  teamId: string,
  patch: Record<string, unknown>
) {
  const id = String(teamId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old: unknown) => {
    if (!old) return old;
    if (typeof old === 'object' && old !== null && Array.isArray((old as { data?: unknown }).data)) {
      const typed = old as { data: Array<{ _id: string }> };
      return {
        ...typed,
        data: typed.data.map((t) => (String(t._id) === id ? { ...t, ...patch } : t)),
      };
    }
    return old;
  });
  queryClient.setQueryData([KEY, teamId], (old: Record<string, unknown> | undefined) =>
    old ? { ...old, ...patch } : old
  );
}

export function useTeams(params?: { page?: number; limit?: number; department?: string }) {
  return useQuery({ queryKey: [KEY, params], queryFn: () => teamApi.list(params) });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => teamApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Team created');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create team');
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      payload,
    }: {
      teamId: string;
      payload: Record<string, unknown>;
    }) => teamApi.update(teamId, payload),
    onMutate: async ({ teamId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [KEY] });
      patchTeamInCaches(queryClient, teamId, payload);
      return { previous };
    },
    onSuccess: (data, variables) => {
      if (data) patchTeamInCaches(queryClient, variables.teamId, data as Record<string, unknown>);
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Team updated');
    },
    onError: (
      error: { response?: { data?: { message?: string } } },
      _vars,
      context?: { previous?: Array<[unknown, unknown]> }
    ) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key as string[], data);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to update team');
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => teamApi.deactivate(teamId),
    onMutate: async (teamId) => {
      await queryClient.cancelQueries({ queryKey: [KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [KEY] });
      removeTeamFromCaches(queryClient, teamId);
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success('Team deleted');
    },
    onError: (
      error: { response?: { data?: { message?: string } } },
      _teamId,
      context?: { previous?: Array<[unknown, unknown]> }
    ) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key as string[], data);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to delete team');
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamApi.addMember(teamId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success('Member added');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message ?? 'Failed to add member');
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      name,
    }: {
      teamId: string;
      userId: string;
      name?: string;
    }) => teamApi.removeMember(teamId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.teamId] });
      const name = variables?.name ? String(variables.name) : 'Member';
      toast.success('Member removed', {
        description: `${name} is no longer on this team.`,
      });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message ?? 'Unable to remove member from team');
    },
  });
}
