/** Notification types mirrored from backend — used for inbox importance settings */
export const INBOX_NOTIFICATION_TYPES = [
  { id: 'task_assigned', label: 'Task assigned', group: 'Tasks' },
  { id: 'task_created', label: 'Task created', group: 'Tasks' },
  { id: 'task_status_changed', label: 'Task status changed', group: 'Tasks' },
  { id: 'task_due_soon', label: 'Task due soon', group: 'Tasks' },
  { id: 'task_pending_approval', label: 'Task pending approval', group: 'Tasks' },
  { id: 'task_approved', label: 'Task approved', group: 'Tasks' },
  { id: 'task_rejected', label: 'Task rejected', group: 'Tasks' },
  { id: 'task_deleted', label: 'Task deleted', group: 'Tasks' },
  { id: 'comment_added', label: 'Comment added', group: 'Comments' },
  { id: 'mentioned', label: 'Mentioned', group: 'Comments' },
  { id: 'project_invite', label: 'Project invite', group: 'Projects' },
  { id: 'project_created', label: 'Project created', group: 'Projects' },
  { id: 'project_member_added', label: 'Project member added', group: 'Projects' },
  { id: 'project_updated', label: 'Project updated', group: 'Projects' },
  { id: 'project_deleted', label: 'Project deleted', group: 'Projects' },
  { id: 'user_invited', label: 'User invited', group: 'Workspace' },
  { id: 'user_deleted', label: 'User deleted', group: 'Workspace' },
  { id: 'user_deactivated', label: 'User deactivated', group: 'Workspace' },
  { id: 'department_created', label: 'Department created', group: 'Workspace' },
  { id: 'team_created', label: 'Team created', group: 'Workspace' },
  { id: 'meeting_scheduled', label: 'Meeting scheduled', group: 'Meetings' },
  { id: 'message_received', label: 'Message received', group: 'Messages' },
];

/** System/admin events — Superadmin inbox only (mirrored from backend) */
export const SYSTEM_ONLY_NOTIFICATION_TYPES = [
  'task_deleted',
  'project_deleted',
  'user_deleted',
  'user_deactivated',
];

export const DEFAULT_IMPORTANT_TYPES = [
  'task_assigned',
  'task_created',
  'task_status_changed',
  'task_pending_approval',
  'task_approved',
  'comment_added',
  'mentioned',
  'meeting_scheduled',
  'project_member_added',
  'project_invite',
  'message_received',
];

export function buildDefaultImportantMap() {
  const map = {};
  for (const t of INBOX_NOTIFICATION_TYPES) {
    map[t.id] = DEFAULT_IMPORTANT_TYPES.includes(t.id);
  }
  return map;
}

export function countImportantTypes(importantTypes) {
  const total = INBOX_NOTIFICATION_TYPES.length;
  const enabled = INBOX_NOTIFICATION_TYPES.filter((t) => importantTypes[t.id]).length;
  return { enabled, total };
}
