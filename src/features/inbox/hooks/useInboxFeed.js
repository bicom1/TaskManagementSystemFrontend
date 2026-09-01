import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { taskApi } from '@/features/tasks/api/taskApi';
import { STATUS_LABELS } from '@/features/tasks/api/taskApi';
import { homeApi } from '@/features/home/api/homeApi';
import { useAuthStore } from '@/store/authStore';
import {
  buildInboxFeedItem,
  filterReplies,
  mergeTaskFeedItems,
} from '../inboxUtils';

function sortItems(items, newestFirst) {
  return [...items].sort((a, b) => {
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return newestFirst ? db - da : da - db;
  });
}

export function useInboxFeed(
  notifications,
  overrides,
  { repliesOnly = false, tasksOnly = false, importantTypes = {}, sortNewestFirst = true } = {}
) {
  const userId = useAuthStore((s) => s.user?._id);

  const filtered = useMemo(() => {
    let list = notifications ?? [];
    if (repliesOnly) list = filterReplies(list);
    if (tasksOnly) {
      list = list.filter(
        (n) => n.entityType === 'Task' || /task/i.test(n.type || '')
      );
    }
    return list;
  }, [notifications, repliesOnly, tasksOnly]);

  const { data: liveTasks = [], isLoading: tasksListLoading } = useQuery({
    queryKey: ['inbox-live-tasks', userId],
    queryFn: () => homeApi.myTasks('inbox'),
    enabled: Boolean(userId) && !repliesOnly,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const taskIds = useMemo(() => {
    const fromNotifs = filtered
      .filter((n) => n.entityType === 'Task' && n.entityId)
      .map((n) => String(n.entityId));
    const fromLive = (liveTasks || []).map((t) => String(t._id));
    return [...new Set([...fromNotifs, ...fromLive])].slice(0, 60);
  }, [filtered, liveTasks]);

  const taskQueries = useQueries({
    queries: taskIds.map((id) => ({
      queryKey: ['task', id, 'inbox-feed'],
      queryFn: () => taskApi.getById(id),
      staleTime: 60_000,
      retry: 1,
    })),
  });

  const taskMap = useMemo(() => {
    const map = {};
    taskQueries.forEach((q, i) => {
      if (q.data) map[taskIds[i]] = q.data;
    });
    for (const t of liveTasks || []) {
      if (t?._id) map[String(t._id)] = { ...t, ...map[String(t._id)] };
    }
    return map;
  }, [taskQueries, taskIds, liveTasks]);

  const tasksLoading = taskQueries.some((q) => q.isLoading) || tasksListLoading;

  const feedItems = useMemo(() => {
    const prefs = { importantTypes };
    const fromNotifications = filtered.map((n) =>
      buildInboxFeedItem(n, taskMap, overrides, prefs)
    );
    const merged = mergeTaskFeedItems(fromNotifications, liveTasks, overrides, userId);
    return sortItems(merged, sortNewestFirst);
  }, [
    filtered,
    taskMap,
    overrides,
    importantTypes,
    sortNewestFirst,
    liveTasks,
    userId,
  ]);

  const byBucket = useMemo(() => {
    const buckets = { all: [], primary: [], other: [], later: [], cleared: [] };
    for (const item of feedItems) {
      buckets[item.bucket]?.push(item);
      if (item.bucket !== 'cleared') buckets.all.push(item);
    }
    for (const key of Object.keys(buckets)) {
      buckets[key] = sortItems(buckets[key], sortNewestFirst);
    }
    return buckets;
  }, [feedItems, sortNewestFirst]);

  const tabStats = useMemo(() => {
    const stats = {};
    for (const key of ['all', 'primary', 'other', 'later', 'cleared']) {
      const items = byBucket[key] || [];
      stats[key] = {
        total: items.length,
        unread: items.filter((i) => !i.isRead).length,
        tasks: items.filter((i) => i.taskId).length,
      };
    }
    return stats;
  }, [byBucket]);

  return {
    feedItems,
    byBucket,
    tabStats,
    tasksLoading,
    taskMap,
  };
}

export function getTaskHref(item) {
  if (item?.href) return item.href;
  if (item?.projectId && item?.taskId) {
    return `/projects/${item.projectId}?task=${item.taskId}`;
  }
  if (item?.taskId) return `/all-tasks?task=${item.taskId}`;
  if (item?.notification?.entityType === 'Project' && item?.notification?.entityId) {
    return `/projects/${item.notification.entityId}`;
  }
  return '/all-tasks';
}

export { STATUS_LABELS };
