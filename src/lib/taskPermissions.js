import { ROLES } from './roles';

export function isOwnTask(user, task) {
  if (!user?._id || !task) return false;
  const uid = String(user._id);
  if (String(task.reporter?._id || task.reporter) === uid) return true;
  return (task.assignees || []).some((a) => String(a._id || a) === uid);
}

/**
 * Any authenticated user who can open a task can edit it
 * (status, assignees, details). Backend mirrors this via getTaskAccess.
 */
export function canManageTask(user, task) {
  if (!user || !task) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (task.canManage != null) return Boolean(task.canManage);
  // Fallback when API has not attached canManage yet — allow edit for viewers.
  return true;
}
