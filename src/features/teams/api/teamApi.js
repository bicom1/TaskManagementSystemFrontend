import { axiosClient } from '../../../api/axiosClient';

export const teamApi = {
  list: (params) =>
    axiosClient.get('/teams', { params }).then((r) => r.data),

  getById: (id) =>
    axiosClient.get(`/teams/${id}`).then((r) => r.data.data),

  create: (payload) =>
    axiosClient.post('/teams', payload).then((r) => r.data.data),

  update: (id, payload) =>
    axiosClient.patch(`/teams/${id}`, payload).then((r) => r.data.data),

  addMember: (id, userId) =>
    axiosClient.post(`/teams/${id}/members`, { userId }).then((r) => r.data.data),

  removeMember: (id, userId) =>
    axiosClient.delete(`/teams/${id}/members/${userId}`).then((r) => r.data.data),
};
