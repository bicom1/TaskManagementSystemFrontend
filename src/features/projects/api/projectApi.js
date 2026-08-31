import { axiosClient } from '../../../api/axiosClient';

export const projectApi = {
  list: (params) =>
    axiosClient.get('/projects', { params }).then((r) => r.data),

  getById: (id) =>
    axiosClient.get(`/projects/${id}`).then((r) => r.data.data),

  create: (payload) =>
    axiosClient.post('/projects', payload).then((r) => r.data.data),

  update: (id, payload) =>
    axiosClient.patch(`/projects/${id}`, payload).then((r) => r.data.data),

  delete: (id) =>
    axiosClient.delete(`/projects/${id}`).then((r) => r.data.data),

  addMember: (id, userId) =>
    axiosClient.post(`/projects/${id}/members`, { userId }).then((r) => r.data.data),
};

export const PROJECT_STATUS_LABELS = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
};
