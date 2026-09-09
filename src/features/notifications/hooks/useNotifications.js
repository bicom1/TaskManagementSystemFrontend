import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationApi } from '../api/notificationApi';
import { taskApi } from '../../tasks/api/taskApi';
import { getSocket } from '../../../api/socketClient';
import { useAuthStore } from '../../../store/authStore';
import { playMessageNotifySound } from '../../../lib/notifySound';
import { ROLES, normalizeRole } from '@/lib/roles';
import { SYSTEM_ONLY_NOTIFICATION_TYPES } from '@/features/inbox/inboxNotificationTypes';
import { isDuplicateEvent } from '@/lib/socketDedupe';

export const NOTIF_LIST_KEY = 'notifications';
export const NOTIF_COUNT_KEY = 'notifications-unread-count';

function isSystemNotification(notification) {
  if (!notification) return false;
  if (notification.scope === 'system') return true;
  return SYSTEM_ONLY_NOTIFICATION_TYPES.includes(notification.type);
}

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

async function openTaskNotification(notification, navigate) {
  if (notification?.entityType !== 'Task' || !notification?.entityId) {
    navigate('/inbox?view=activity');
    return;
  }
  try {
    const task = await taskApi.getById(notification.entityId);
    const projectId = task?.project?._id || task?.project;
    if (projectId) {
      navigate(`/projects/${projectId}?task=${notification.entityId}`);
      return;
    }
  } catch {
    // fall through
  }
  navigate('/home/my-tasks?view=assigned');
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
    refetchInterval: 30_000,
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
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getSocket();
    const isSuperadmin = normalizeRole(role) === ROLES.SUPERADMIN;

    const handleNew = (notification) => {
      // One toast and one badge increment per notification, however many times
      // the socket delivers it.
      if (isDuplicateEvent(`notification:${notification?._id}`)) return;

      // Members never surface Superadmin system events (delete user/project/task, …)
      if (!isSuperadmin && isSystemNotification(notification)) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: [NOTIF_LIST_KEY] });
      queryClient.setQueryData([NOTIF_COUNT_KEY], (old) =>
        typeof old === 'number' ? old + 1 : 1
      );
      queryClient.invalidateQueries({ queryKey: [NOTIF_COUNT_KEY] });

      const isTaskAssigned =
        notification?.type === 'task_assigned' ||
        /assigned/i.test(notification?.message || '');

      const isTaskActivity =
        notification?.type === 'task_created' ||
        notification?.type === 'task_status_changed' ||
        isTaskAssigned;

      if (isTaskActivity) {
        queryClient.invalidateQueries({ queryKey: ['home'] });
        if (isTaskAssigned) playMessageNotifySound();
      }

      if (notification?.type === 'message_received' && /chat/i.test(notification.message || '')) {
        return;
      }

      // Self-triggered ("You created …") — the inbox entry and badge still update
      // above, but the mutation already toasted, so don't toast the same act twice.
      const senderId = String(notification?.sender?._id || notification?.sender || '');
      if (userId && senderId === String(userId)) return;

      const deleteTypes = new Set(['task_deleted', 'project_deleted', 'user_deleted']);
      if (deleteTypes.has(notification?.type)) {
        toast.success(notification.message || 'Item deleted', {
          id: `notification:${notification?._id}`,
          duration: 6000,
          description: 'Open Inbox → Activity for details',
          action: {
            label: 'View',
            onClick: () => navigate('/inbox?view=activity'),
          },
        });
        return;
      }

      toast(notification.message, {
        id: `notification:${notification?._id}`,
        duration: 8000,
        action: isTaskAssigned
          ? {
              label: 'Open task',
              onClick: () => openTaskNotification(notification, navigate),
            }
          : {
              label: 'View',
              onClick: () => navigate('/inbox?view=activity'),
            },
      });
    };

    socket.on('notification:new', handleNew);

    const refreshInbox = () => {
      queryClient.invalidateQueries({ queryKey: [NOTIF_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIF_COUNT_KEY] });
      queryClient.invalidateQueries({ queryKey: ['inbox-live-tasks'] });
    };
    socket.on('task:created', refreshInbox);
    socket.on('task:updated', refreshInbox);

    return () => {
      socket.off('notification:new', handleNew);
      socket.off('task:created', refreshInbox);
      socket.off('task:updated', refreshInbox);
    };
  }, [queryClient, navigate, token, role, userId]);
}
