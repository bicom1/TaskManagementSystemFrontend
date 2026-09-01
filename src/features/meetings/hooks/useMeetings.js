import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { meetingsApi } from '../api/meetingsApi';

export function useMeetingsList() {
  return useQuery({
    queryKey: ['meetings', 'list'],
    queryFn: meetingsApi.list,
    staleTime: 15_000,
  });
}

export function useLocationsList() {
  return useQuery({
    queryKey: ['locations', 'list'],
    queryFn: meetingsApi.listLocations,
    staleTime: 30_000,
  });
}

export function useAskMeetingAi() {
  return useMutation({
    mutationFn: meetingsApi.ask,
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Could not get an answer'),
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingsApi.create,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      const teamMode = Boolean(variables?.team);
      const count = teamMode
        ? 'all team members'
        : `${variables?.attendees?.length || 0} person${variables?.attendees?.length === 1 ? '' : 's'}`;
      toast.success(`Meeting scheduled — ${count} notified by email and in-app alert`);
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Could not schedule meeting'),
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: meetingsApi.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      toast.success('Location added');
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Could not add location'),
  });
}
