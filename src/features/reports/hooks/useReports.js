import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';

export function useWorkspaceOverview() {
  return useQuery({
    queryKey: ['report-workspace'],
    queryFn: reportApi.workspaceOverview,
    refetchInterval: 30_000,
  });
}

export function useProjectSummary(projectId) {
  return useQuery({
    queryKey: ['report-summary', projectId],
    queryFn: () => reportApi.projectSummary(projectId),
    enabled: Boolean(projectId),
    refetchInterval: 30_000,
  });
}

export function useTeamWorkload(projectId) {
  return useQuery({
    queryKey: ['report-workload', projectId],
    queryFn: () => reportApi.teamWorkload(projectId),
    enabled: Boolean(projectId),
    refetchInterval: 30_000,
  });
}

export function useCompletionTrend(projectId, days = 14) {
  return useQuery({
    queryKey: ['report-trend', projectId, days],
    queryFn: () => reportApi.completionTrend(projectId, days),
    enabled: Boolean(projectId),
    refetchInterval: 30_000,
  });
}
