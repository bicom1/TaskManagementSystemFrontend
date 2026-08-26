import { axiosClient } from '../../../api/axiosClient';

export const notificationApi = {
  list: (params) =>
    axiosClient.get('/notifications', { params }).then((r) => r.data),

  unreadCount: () =>
    axiosClient.get('/notifications/unread-count').then((r) => r.data.data.count),

  markAllRead: () => axiosClient.patch('/notifications/mark-all-read'),

  markOneRead: (id) =>
    axiosClient.patch(`/notifications/${id}/read`).then((r) => r.data.data),
};
