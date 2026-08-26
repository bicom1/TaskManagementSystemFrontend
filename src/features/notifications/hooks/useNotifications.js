import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationApi } from '../api/notificationApi';
import { getSocket } from '../../../api/socketClient';
import { useAuthStore } from '../../../store/authStore';

export const NOTIF_LIST_KEY = 'notifications';
export const NOTIF_COUNT_KEY = 'notifications-unread-count';

function markListsRead(queryClient, predicate) {
  queryClient.setQueriesData({ queryKey: [NOTIF_LIST_KEY] }, (old) => {
    if (!old?.data) return old;
    return {
      ...old,
      data: old.data.map((n) =>
        predicate(n) ? { ...n, isRead: true } : n
      ),
    };
  });
}

export function useNotifications(params) {
  return useQuery({
    queryKey: [NOTIF_LIST_KEY, params],
    queryFn: () => notificationApi.list(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [NOTIF_COUNT_KEY],
    queryFn: notificationApi.unreadCount,
    staleTime: 15_000,
  });
}

/** Mark every unread notification as read; badge count goes to 0. */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [NOTIF_COUNT_KEY] });
      await queryClient.cancelQueries({ queryKey: [NOTIF_LIST_KEY] });
      const previousCount = queryClient.getQueryData([NOTIF_COUNT_KEY]);
      queryClient.setQueryData([NOTIF_COUNT_KEY], 0);
      markListsRead(queryClient, (n) => !n.isRead);
      return { previousCount };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousCount != null) {
        queryClient.setQueryData([NOTIF_COUNT_KEY], ctx.previousCount);
      }
      queryClient.invalidateQueries({ queryKey: [NOTIF_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIF_COUNT_KEY] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIF_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIF_COUNT_KEY] });
    },
  });
}

/** Mark one notification as read; badge count decreases by 1. */
export function useMarkOneRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationApi.markOneRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTIF_COUNT_KEY] });
      await queryClient.cancelQueries({ queryKey: [NOTIF_LIST_KEY] });
      const previousCount = queryClient.getQueryData([NOTIF_COUNT_KEY]);
      const lists = queryClient.getQueriesData({ queryKey: [NOTIF_LIST_KEY] });
      let wasUnread = false;
      for (const [, old] of lists) {
        const row = old?.data?.find((n) => String(n._id) === String(id));
        if (row && !row.isRead) {
          wasUnread = true;
          break;
        }
      }
      if (wasUnread && typeof previousCount === 'number') {
        queryClient.setQueryData([NOTIF_COUNT_KEY], Math.max(0, previousCount - 1));
      }
      markListsRead(queryClient, (n) => String(n._id) === String(id));
      return { previousCount };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previousCount != null) {
        queryClient.setQueryData([NOTIF_COUNT_KEY], ctx.previousCount);
      }
      queryClient.invalidateQueries({ queryKey: [NOTIF_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIF_COUNT_KEY] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIF_COUNT_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [NOTIF_LIST_KEY] });
      queryClient.setQueryData([NOTIF_COUNT_KEY], (old) =>
        typeof old === 'number' ? old + 1 : 1
      );
      queryClient.invalidateQueries({ queryKey: [NOTIF_COUNT_KEY] });

      if (
        notification?.type === 'task_assigned' ||
        /assigned/i.test(notification?.message || '')
      ) {
        queryClient.invalidateQueries({ queryKey: ['home'] });
      }

      if (notification?.type === 'message_received' && /chat/i.test(notification.message || '')) {
        return;
      }
      toast(notification.message, {
        action:
          notification?.type === 'task_assigned'
            ? {
                label: 'View',
                onClick: () => {
                  window.location.href = '/home/my-tasks?view=assigned';
                },
              }
            : undefined,
      });
    };

    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [queryClient, token]);
}
