import { axiosClient } from '../../../api/axiosClient';

export const userApi = {
  me: (config = {}) =>
    axiosClient.get('/users/me', { skipAuthRefresh: true, ...config }).then((r) => r.data.data),

  list: (params) => axiosClient.get('/users', { params }).then((r) => r.data),

  getById: (id) => axiosClient.get(`/users/${id}`).then((r) => r.data.data),

  invite: (payload) =>
    axiosClient
      .post('/users/invite', payload, { timeout: 90_000 })
      .then((r) => r.data.data),

  updateUser: (id, payload) =>
    axiosClient.patch(`/users/${id}`, payload).then((r) => r.data.data),

  deactivate: (id) =>
    axiosClient.patch(`/users/${id}/deactivate`).then((r) => r.data.data),

  reactivate: (id) =>
    axiosClient.patch(`/users/${id}/reactivate`).then((r) => r.data.data),

  remove: (id) => axiosClient.delete(`/users/${id}`).then((r) => r.data.data),

  updateMe: (payload) =>
    axiosClient.patch('/users/me', payload).then((r) => r.data.data),

  changePassword: (payload) =>
    axiosClient.patch('/users/me/password', payload).then((r) => r.data),

  previewInvite: (token) =>
    axiosClient.get('/users/invite/preview', { params: { token } }).then((r) => r.data.data),

  acceptInvite: (payload) =>
    axiosClient.post('/users/invite/accept', payload).then((r) => r.data.data),
};
