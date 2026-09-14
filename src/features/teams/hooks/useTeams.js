import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teamApi } from '../api/teamApi';

const KEY = 'teams';

function removeTeamFromCaches(queryClient, teamId) {
  const id = String(teamId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old) => {
    if (!old) return old;
    if (Array.isArray(old.data)) {
      return {
        ...old,
        data: old.data.filter((t) => String(t._id) !== id),
        pagination: old.pagination
          ? {
              ...old.pagination,
              total: Math.max(0, (old.pagination.total || 0) - 1),
            }
          : old.pagination,
      };
    }
    if (Array.isArray(old)) {
      return old.filter((t) => String(t._id) !== id);
    }
    return old;
  });
  queryClient.removeQueries({ queryKey: [KEY, teamId] });
}

function patchTeamInCaches(queryClient, teamId, patch) {
  const id = String(teamId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old) => {
    if (!old) return old;
    if (Array.isArray(old.data)) {
      return {
        ...old,
        data: old.data.map((t) =>
          String(t._id) === id ? { ...t, ...patch } : t
        ),
      };
    }
    return old;
  });
  queryClient.setQueryData([KEY, teamId], (old) =>
    old ? { ...old, ...patch } : old
  );
}

export function useTeams(params) {
  return useQuery({ queryKey: [KEY, params], queryFn: () => teamApi.list(params) });
}

export function useTeam(id) {
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
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create team');
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }) => teamApi.update(teamId, payload),
    onMutate: async ({ teamId, payload }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [KEY] });
      patchTeamInCaches(queryClient, teamId, payload);
      return { previous };
    },
    onSuccess: (data, variables) => {
      if (data) patchTeamInCaches(queryClient, variables.teamId, data);
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Team updated');
    },
    onError: (error, _vars, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to update team');
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId) => teamApi.deactivate(teamId),
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
    onError: (error, teamId, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to delete team');
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }) => teamApi.addMember(teamId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.teamId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success('Member added');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to add member');
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }) => teamApi.removeMember(teamId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.teamId] });
      const name = variables?.name ? String(variables.name) : 'Member';
      toast.success('Member removed', {
        description: `${name} is no longer on this team.`,
      });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Unable to remove member from team');
    },
  });
}
