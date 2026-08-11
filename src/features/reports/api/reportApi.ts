import { axiosClient } from '../../../api/axiosClient';

export interface ProjectSummary {
  totalTasks: number;
  overdueTasks: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface WorkloadEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  openTasks: number;
}

export interface CompletionTrendEntry {
  _id: string; // date string YYYY-MM-DD
  completed: number;
}

export const reportApi = {
  projectSummary: (projectId: string) =>
    axiosClient.get<{ data: ProjectSummary }>(`/reports/project/${projectId}/summary`).then((r) => r.data.data),

  teamWorkload: (projectId: string) =>
    axiosClient.get<{ data: WorkloadEntry[] }>(`/reports/project/${projectId}/workload`).then((r) => r.data.data),

  completionTrend: (projectId: string, days = 14) =>
    axiosClient
      .get<{ data: CompletionTrendEntry[] }>(`/reports/project/${projectId}/trend`, { params: { days } })
      .then((r) => r.data.data),
};
