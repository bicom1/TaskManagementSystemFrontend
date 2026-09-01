import { ROLES } from './roles';

export function isOwnTask(user, task) {
  if (!user?._id || !task) return false;
  const uid = String(user._id);
  if (String(task.reporter?._id || task.reporter) === uid) return true;
  return (task.assignees || []).some((a) => String(a._id || a) === uid);
}

/** Super Admin can manage any task; others only their own (assignee/reporter). */
export function canManageTask(user, task) {
  if (!user || !task) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (task.canManage != null) return Boolean(task.canManage);
  return isOwnTask(user, task);
}
