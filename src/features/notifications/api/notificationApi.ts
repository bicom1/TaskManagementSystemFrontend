import { axiosClient } from '../../../api/axiosClient';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: { _id: string; name: string; avatarUrl: string | null };
  type: string;
  message: string;
  entityType: 'Task' | 'Project' | 'Comment';
  entityId: string;
  isRead: boolean;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const notificationApi = {
  list: (params?: { page?: number; limit?: number }) =>
    axiosClient.get<PaginatedResponse<Notification>>('/notifications', { params }).then((r) => r.data),

  unreadCount: () =>
    axiosClient.get<{ data: { count: number } }>('/notifications/unread-count').then((r) => r.data.data.count),

  markAllRead: () => axiosClient.patch('/notifications/mark-all-read'),
};
