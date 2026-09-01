import {
  differenceInDays,
  format,
  isToday,
  isYesterday,
  subDays,
} from 'date-fns';
import { notificationKey, taskFeedKey } from './inboxTriageStore';
import { STATUS_LABELS } from '@/features/tasks/api/taskApi';

import { DEFAULT_IMPORTANT_TYPES } from './inboxNotificationTypes';

const INCOMING_TYPES = new Set([
  'task_assigned',
  'task_created',
  'task_pending_approval',
]);

const TASK_ACTIVITY_TYPES = new Set([
  'task_assigned',
  'task_created',
  'task_status_changed',
  'task_due_soon',
  'task_pending_approval',
  'task_approved',
  'task_rejected',
  'comment_added',
  'mentioned',
]);

const STATUS_COLORS = {
  backlog: 'bg-gray-400',
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  in_review: 'bg-violet-500',
  done: 'bg-emerald-500',
  complete: 'bg-emerald-500',
};

export function statusLabel(status) {
  if (!status) return '';
  const key = String(status).toLowerCase();
  return STATUS_LABELS[key] || key.replace(/_/g, ' ');
}

export function statusColorFromLabel(label) {
  const l = String(label || '').toLowerCase().replace(/\s+/g, '_');
  if (l.includes('progress')) return STATUS_COLORS.in_progress;
  if (l.includes('review')) return STATUS_COLORS.in_review;
  if (l.includes('done') || l.includes('complete')) return STATUS_COLORS.done;
  if (l.includes('todo') || l.includes('to_do')) return STATUS_COLORS.todo;
  return STATUS_COLORS[l] || STATUS_COLORS.backlog;
}

export function extractNotificationTitle(message = '') {
  const quoted = String(message).match(/"([^"]+)"/);
  if (quoted?.[1]) return quoted[1];
  const first = String(message).split(/[.·]/)[0]?.trim();
  return first || 'Workspace update';
}

export function isCompletedNotification(notification) {
  if (notification.type === 'task_approved') return true;
  if (notification.type !== 'task_status_changed') return false;
  return /moved to\s+(done|complete)/i.test(notification.message || '');
}

export function isIncomingTaskNotification(notification) {
  return INCOMING_TYPES.has(notification.type);
}

export function parseStatusFromMessage(message = '') {
  const moved = String(message).match(/moved to\s+(.+?)(?:\s*·|$)/i);
  if (moved?.[1]) return moved[1].trim();
  return null;
}

export function parseStatusTransition(message = '') {
  const arrow = String(message).match(/(.+?)\s*(?:→|->)\s*(.+)$/i);
  if (arrow) {
    return { from: arrow[1].trim(), to: arrow[2].trim() };
  }
  const moved = parseStatusFromMessage(message);
  if (moved) return { from: null, to: moved };
  return null;
}

export function buildInboxFeedItem(notification, taskMap = {}, overrides = {}, prefs = {}) {
  const importantTypes = prefs.importantTypes || {};
  const task =
    notification.entityType === 'Task' && notification.entityId
      ? taskMap[String(notification.entityId)]
      : null;

  const taskId = task?._id || notification.entityId;
  const projectId = task?.project?._id || task?.project || null;
  const projectName = task?.project?.name || null;
  const taskTitle = task?.title || extractNotificationTitle(notification.message);
  const senderName = notification.sender?.name;
  const isIncoming = isIncomingTaskNotification(notification);
  const isCompleted = isCompletedNotification(notification);
  const bucket = resolveBucket(notification, overrides, {
    isIncoming,
    isCompleted,
    importantTypes,
  });

  let actionText = '';
  let statusFrom = null;
  let statusTo = task?.status || null;

  if (notification.type === 'task_status_changed') {
    const transition = parseStatusTransition(notification.message);
    const toLabel = transition?.to || parseStatusFromMessage(notification.message);
    const toKey = toLabel ? toLabel.toLowerCase().replace(/\s+/g, '_') : null;
    statusTo = toKey || task?.status || null;
    if (transition?.from) {
      statusFrom = transition.from;
    } else if (toKey === 'done' || /complete/i.test(toLabel || '')) {
      statusFrom = 'In Progress';
    } else if (task?.status) {
      statusFrom = statusLabel(task.status);
    }
    const fromDisp = statusFrom || 'In Progress';
    const toDisp = toLabel || statusLabel(statusTo) || 'Complete';
    actionText = senderName
      ? `${senderName} changed status: ${fromDisp} → ${toDisp}`
      : `Status: ${fromDisp} → ${toDisp}`;
  } else if (notification.type === 'task_assigned') {
    actionText = senderName ? `${senderName} assigned you this task` : 'New task assigned to you';
  } else if (notification.type === 'task_created') {
    actionText = senderName ? `${senderName} created this task` : 'You created this task';
  } else if (notification.type === 'task_approved') {
    actionText = senderName ? `${senderName} approved this task` : 'Task approved';
    statusTo = 'done';
  } else if (notification.type === 'comment_added' || notification.type === 'mentioned') {
    actionText = senderName ? `${senderName} commented on this task` : 'New comment';
  } else {
    actionText = senderName ? `${senderName} · ${notification.message}` : notification.message;
  }

  const href =
    projectId && taskId
      ? `/projects/${projectId}?task=${taskId}`
      : taskId
        ? `/all-tasks?task=${taskId}`
        : notification.entityType === 'Project' && notification.entityId
          ? `/projects/${notification.entityId}`
          : null;

  return {
    id: notification._id,
    notification,
    bucket,
    taskId: taskId ? String(taskId) : null,
    projectId: projectId ? String(projectId) : null,
    projectName,
    taskTitle,
    taskStatus: task?.status || statusTo,
    actionText,
    statusFrom,
    statusTo: statusTo ? statusLabel(statusTo) : parseStatusFromMessage(notification.message),
    isIncoming:
      isIncoming ||
      notification.type === 'task_created',
    isCompleted,
    isRead: Boolean(notification.isRead),
    isHighPriority:
      isIncoming ||
      isCompleted ||
      notification.type === 'task_pending_approval' ||
      !notification.isRead ||
      Boolean(importantTypes[notification.type]),
    href,
    createdAt: notification.createdAt,
    sender: notification.sender,
  };
}

/** Live task row when notification is missing or delayed */
export function buildTaskFeedItem(task, overrides = {}, userId) {
  const taskId = String(task._id);
  const projectId = task.project?._id || task.project;
  const projectName = task.project?.name || null;
  const reporterId = String(task.reporter?._id || task.reporter || '');
  const isReporter = reporterId && reporterId === String(userId);
  const isAssignee = (task.assignees || []).some(
    (a) => String(a._id || a) === String(userId)
  );
  const isDone = task.status === 'done';
  const ageDays = differenceInDays(new Date(), new Date(task.createdAt));

  let bucket = 'primary';
  const overrideKey = taskFeedKey(taskId);
  if (overrides[overrideKey]) {
    bucket = overrides[overrideKey];
  } else if (isDone) {
    bucket = 'primary';
  } else if (isReporter || isAssignee) {
    bucket = ageDays <= 14 ? 'primary' : 'other';
  } else {
    bucket = 'other';
  }

  let actionText = 'Task updated';
  if (isDone) {
    actionText = `Completed · ${statusLabel(task.status)}`;
  } else if (isReporter) {
    actionText = 'You created this task';
  } else if (isAssignee) {
    actionText = 'Assigned to you';
  }

  const href = projectId
    ? `/projects/${projectId}?task=${taskId}`
    : `/all-tasks?task=${taskId}`;

  return {
    id: `task-${taskId}`,
    notification: { type: isReporter ? 'task_created' : 'task_assigned', entityType: 'Task' },
    bucket,
    taskId,
    projectId: projectId ? String(projectId) : null,
    projectName,
    taskTitle: task.title,
    taskStatus: task.status,
    actionText,
    statusFrom: null,
    statusTo: isDone ? statusLabel(task.status) : null,
    isIncoming: isReporter || isAssignee,
    isCompleted: isDone,
    isRead: false,
    isHighPriority: isReporter || isAssignee || isDone,
    href,
    createdAt: task.updatedAt || task.createdAt,
    sender: task.reporter || null,
    isSynthetic: true,
  };
}

export function mergeTaskFeedItems(notificationItems, tasks, overrides, userId) {
  const covered = new Set(
    notificationItems.filter((i) => i.taskId).map((i) => String(i.taskId))
  );

  const synthetic = (tasks || [])
    .filter((task) => {
      const id = String(task._id);
      if (covered.has(id)) return false;
      const ageDays = differenceInDays(new Date(), new Date(task.createdAt));
      if (ageDays > 21) return false;
      const reporterId = String(task.reporter?._id || task.reporter || '');
      const isAssignee = (task.assignees || []).some(
        (a) => String(a._id || a) === String(userId)
      );
      return reporterId === String(userId) || isAssignee;
    })
    .map((task) => buildTaskFeedItem(task, overrides, userId));

  return [...notificationItems, ...synthetic];
}

export function getAutoBucket(notification, { isIncoming, isCompleted, importantTypes = {} } = {}) {
  const created = new Date(notification.createdAt);
  const ageDays = differenceInDays(new Date(), created);
  const isTask = notification.entityType === 'Task' || TASK_ACTIVITY_TYPES.has(notification.type);
  const isImportant =
    importantTypes[notification.type] ??
    DEFAULT_IMPORTANT_TYPES.includes(notification.type);

  if (ageDays > 45) return 'later';

  // Read items → Other (then Later when older)
  if (notification.isRead) {
    if (ageDays <= 30) return 'other';
    return 'later';
  }

  // Unread → Primary (new tasks, assignments, completions, important)
  if (isImportant && ageDays <= 14) return 'primary';
  if (notification.type === 'task_created' && ageDays <= 14) return 'primary';

  if (isTask && ageDays <= 7) {
    if (isIncoming || isCompleted) return 'primary';
    if (TASK_ACTIVITY_TYPES.has(notification.type)) return 'primary';
  }

  if (isTask && isCompleted && ageDays <= 14) return 'primary';

  if (isTask && ageDays <= 30) return 'other';
  if (!isTask && ageDays <= 14) return 'other';

  return 'later';
}

export function resolveBucket(notification, overrides, meta = {}) {
  const key = notificationKey(notification._id);
  if (overrides[key]) return overrides[key];
  return getAutoBucket(notification, meta);
}

export function groupFeedByTime(items) {
  const now = new Date();
  const weekAgo = subDays(now, 7);

  const groups = { today: [], yesterday: [], last7: [], older: [] };

  for (const item of items) {
    const d = new Date(item.createdAt);
    if (isToday(d)) groups.today.push(item);
    else if (isYesterday(d)) groups.yesterday.push(item);
    else if (d >= weekAgo) groups.last7.push(item);
    else groups.older.push(item);
  }

  return groups;
}

export function formatInboxDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function countUnreadInBucket(items) {
  return items.filter((i) => !i.isRead).length;
}

export function filterReplies(notifications) {
  return notifications.filter(
    (n) =>
      n.type === 'comment_added' ||
      n.type === 'mentioned' ||
      /comment|replied|mention/i.test(n.message || '')
  );
}

// Legacy helpers used elsewhere
export function extractActionText(notification) {
  return buildInboxFeedItem(notification).actionText;
}

export function isHighPriority(notification) {
  return buildInboxFeedItem(notification).isHighPriority;
}

export function groupNotificationsByTime(notifications) {
  return groupFeedByTime(notifications.map((n) => buildInboxFeedItem(n)));
}

export function countUnreadInBucketLegacy(notifications, bucket, overrides) {
  return notifications.filter((n) => {
    const item = buildInboxFeedItem(n, {}, overrides);
    return item.bucket === bucket && !item.isRead;
  }).length;
}
