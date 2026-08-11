import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teamApi } from '../api/teamApi';

const KEY = 'teams';

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
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to remove member');
    },
  });
}
