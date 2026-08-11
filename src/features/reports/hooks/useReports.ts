import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';

export function useProjectSummary(projectId: string) {
  return useQuery({
    queryKey: ['report-summary', projectId],
    queryFn: () => reportApi.projectSummary(projectId),
    enabled: Boolean(projectId),
  });
}

export function useTeamWorkload(projectId: string) {
  return useQuery({
    queryKey: ['report-workload', projectId],
    queryFn: () => reportApi.teamWorkload(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCompletionTrend(projectId: string, days = 14) {
  return useQuery({
    queryKey: ['report-trend', projectId, days],
    queryFn: () => reportApi.completionTrend(projectId, days),
    enabled: Boolean(projectId),
  });
}
