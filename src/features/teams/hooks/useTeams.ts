import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teamApi } from '../api/teamApi';

const KEY = 'teams';

export function useTeams(params?: { page?: number; limit?: number; department?: string }) {
  return useQuery({ queryKey: [KEY, params], queryFn: () => teamApi.list(params) });
}

export function useTeam(id: string) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => teamApi.getById(id), enabled: Boolean(id) });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: teamApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Team created');
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamApi.addMember(teamId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY, variables.teamId] });
      toast.success('Member added');
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamApi.removeMember(teamId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY, variables.teamId] });
    },
  });
}
