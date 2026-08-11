import { axiosClient } from '../../../api/axiosClient';

export const messageApi = {
  inbox: (params) =>
    axiosClient.get('/messages/inbox', { params }).then((r) => r.data),

  send: (payload) =>
    axiosClient.post('/messages', payload).then((r) => r.data.data),

  markRead: (id) =>
    axiosClient.patch(`/messages/${id}/read`).then((r) => r.data.data),

  markAllRead: () =>
    axiosClient.patch('/messages/mark-all-read').then((r) => r.data),

  createTask: (id, payload) =>
    axiosClient.post(`/messages/${id}/create-task`, payload).then((r) => r.data.data),
};
