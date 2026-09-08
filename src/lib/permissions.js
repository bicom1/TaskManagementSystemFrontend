import { ROLES, normalizeRole } from './roles';

export const PERMISSIONS = {
  USER_MANAGE: 'USER_MANAGE',
  USER_INVITE: 'USER_INVITE',
  USER_VIEW: 'USER_VIEW',
  TASK_CREATE: 'TASK_CREATE',
  TASK_ASSIGN: 'TASK_ASSIGN',
  TASK_EDIT: 'TASK_EDIT',
  TASK_DELETE: 'TASK_DELETE',
  TASK_APPROVE: 'TASK_APPROVE',
  TEAM_MANAGE: 'TEAM_MANAGE',
  TEAM_VIEW: 'TEAM_VIEW',
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_EDIT: 'PROJECT_EDIT',
  PROJECT_DELETE: 'PROJECT_DELETE',
  PROJECT_VIEW: 'PROJECT_VIEW',
  REPORT_VIEW: 'REPORT_VIEW',
  DEPARTMENT_MANAGE: 'DEPARTMENT_MANAGE',
  DEPARTMENT_VIEW: 'DEPARTMENT_VIEW',
  AUDIT_VIEW: 'AUDIT_VIEW',
  AI_USE: 'AI_USE',
};

const ALL = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  [ROLES.SUPERADMIN]: ALL,
  [ROLES.ADMIN]: [
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_EDIT,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_APPROVE,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.AI_USE,
  ],
  [ROLES.MEMBER]: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_EDIT,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_EDIT,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.AI_USE,
  ],
};

export const INVITABLE_ROLES_BY_ACTOR = {
  [ROLES.SUPERADMIN]: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MEMBER],
  [ROLES.ADMIN]: [ROLES.MEMBER],
  [ROLES.MEMBER]: [],
};

export function getPermissionsForRole(role) {
  const r = normalizeRole(role);
  return ROLE_PERMISSIONS[r] ? [...ROLE_PERMISSIONS[r]] : [];
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (normalizeRole(user.role) === ROLES.SUPERADMIN) return true;
  return getPermissionsForRole(user.role).includes(permission);
}

export function hasAnyPermission(user, ...permissions) {
  return permissions.some((p) => hasPermission(user, p));
}

export function getInvitableRoles(actorRole) {
  return INVITABLE_ROLES_BY_ACTOR[normalizeRole(actorRole)] || [];
}

/** Role-specific dashboard copy (existing HomePage meta — no redesign) */
export function getDashboardMeta(role) {
  switch (normalizeRole(role)) {
    case ROLES.SUPERADMIN:
      return {
        title: 'Organization overview',
        subtitle: 'Full access across every department, team, project, and report.',
        badge: 'Superadmin',
      };
    case ROLES.ADMIN:
      return {
        title: 'Members & progress',
        subtitle: 'Manage members, projects, and tasks. View progress and reports across the workspace.',
        badge: 'Admin',
      };
    default:
      return {
        title: 'My work & reports',
        subtitle: 'Your tasks, projects, and personal progress.',
        badge: 'Member',
      };
  }
}
