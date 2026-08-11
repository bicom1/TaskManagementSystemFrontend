import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationApi } from '../api/notificationApi';
import { getSocket } from '../../../api/socketClient';
import { useAuthStore } from '../../../store/authStore';

const LIST_KEY = 'notifications';
const COUNT_KEY = 'notifications-unread-count';

export function useNotifications(params) {
  return useQuery({
    queryKey: [LIST_KEY, params],
    queryFn: () => notificationApi.list(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [COUNT_KEY],
    queryFn: notificationApi.unreadCount,
  });
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

export function useLiveNotifications() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getSocket();

    const handleNew = (notification) => {
      queryClient.invalidateQueries({ queryKey: [LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [COUNT_KEY] });
      // Chat toasts are handled by useLiveChatNotifications
      if (notification?.type === 'message_received' && /chat/i.test(notification.message || '')) {
        return;
      }
      toast(notification.message);
    };

    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [queryClient, token]);
}
