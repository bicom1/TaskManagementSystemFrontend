import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { meetingsApi } from '../api/meetingsApi';

export function useMeetingsList() {
  return useQuery({
    queryKey: ['meetings', 'list'],
    queryFn: meetingsApi.list,
    staleTime: 15_000,
  });
}

export function useAskMeetingAi() {
  return useMutation({
    mutationFn: meetingsApi.ask,
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Could not get an answer'),
  });
}
