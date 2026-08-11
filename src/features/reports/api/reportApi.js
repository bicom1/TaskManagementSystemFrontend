import { axiosClient } from '../../../api/axiosClient';

export const reportApi = {
  workspaceOverview: () =>
    axiosClient.get('/reports/workspace').then((r) => r.data.data),

  projectSummary: (projectId) =>
    axiosClient.get(`/reports/project/${projectId}/summary`).then((r) => r.data.data),

  teamWorkload: (projectId) =>
    axiosClient.get(`/reports/project/${projectId}/workload`).then((r) => r.data.data),

  completionTrend: (projectId, days = 14) =>
    axiosClient
      .get(`/reports/project/${projectId}/trend`, { params: { days } })
      .then((r) => r.data.data),
};
