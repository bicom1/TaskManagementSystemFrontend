import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationApi, type Notification } from '../api/notificationApi';
import { getSocket } from '../../../api/socketClient';

const LIST_KEY = 'notifications';
const COUNT_KEY = 'notifications-unread-count';

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery({ queryKey: [LIST_KEY, params], queryFn: () => notificationApi.list(params) });
}

export function useUnreadCount() {
  return useQuery({ queryKey: [COUNT_KEY], queryFn: notificationApi.unreadCount });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [COUNT_KEY] });
    },
  });
}

/**
 * Subscribes to the `notification:new` socket event and keeps the list +
 * unread count caches in sync in real time, plus surfaces a toast. Mount
 * this once near the app root (e.g. in a NotificationBell component).
 */
export function useLiveNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    const handleNew = (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [COUNT_KEY] });
      toast(notification.message);
    };

    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [queryClient]);
}
