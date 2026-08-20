import { ROLES } from './roles';

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
  PROJECT_VIEW: 'PROJECT_VIEW',
  REPORT_VIEW: 'REPORT_VIEW',
  DEPARTMENT_MANAGE: 'DEPARTMENT_MANAGE',
  DEPARTMENT_VIEW: 'DEPARTMENT_VIEW',
  AUDIT_VIEW: 'AUDIT_VIEW',
};

const ALL = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL,
  [ROLES.DEPT_HEAD]: [
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
  ],
  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.USER_INVITE,
    PERMISSIONS.USER_VIEW,
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
  ],
  [ROLES.EXECUTIVE]: [
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
  ],
  [ROLES.EMPLOYEE]: [
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
  ],
};

export const INVITABLE_ROLES_BY_ACTOR = {
  [ROLES.SUPER_ADMIN]: [
    ROLES.SUPER_ADMIN,
    ROLES.DEPT_HEAD,
    ROLES.TEAM_LEAD,
    ROLES.EXECUTIVE,
    ROLES.EMPLOYEE,
  ],
  [ROLES.DEPT_HEAD]: [ROLES.TEAM_LEAD, ROLES.EXECUTIVE, ROLES.EMPLOYEE],
  [ROLES.TEAM_LEAD]: [ROLES.EXECUTIVE, ROLES.EMPLOYEE],
  [ROLES.EXECUTIVE]: [],
  [ROLES.EMPLOYEE]: [],
};

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ? [...ROLE_PERMISSIONS[role]] : [];
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  // Role catalog is source of truth (stays in sync when permissions change)
  return getPermissionsForRole(user.role).includes(permission);
}

export function hasAnyPermission(user, ...permissions) {
  return permissions.some((p) => hasPermission(user, p));
}

export function getInvitableRoles(actorRole) {
  return INVITABLE_ROLES_BY_ACTOR[actorRole] || [];
}

/** Role-specific dashboard copy */
export function getDashboardMeta(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return {
        title: 'Organization overview',
        subtitle: 'Full access across every department, team, project, and report.',
        badge: 'Super Admin',
      };
    case ROLES.DEPT_HEAD:
      return {
        title: 'Department dashboard',
        subtitle:
          'Full control in your department (e.g. SEO). You can view Designing & Development, assign and edit there, but not delete.',
        badge: 'Department Head',
      };
    case ROLES.TEAM_LEAD:
      return {
        title: 'Team dashboard',
        subtitle: 'Your team reports, assign work, and manage tasks for your team.',
        badge: 'Team Lead',
      };
    case ROLES.EXECUTIVE:
      return {
        title: 'My work & reports',
        subtitle: 'Your tasks and progress — add, edit, and reassign work you can access.',
        badge: 'Executive',
      };
    default:
      return {
        title: 'My work & reports',
        subtitle: 'Your tasks and progress — add, edit, and reassign work you can access.',
        badge: 'Employee',
      };
  }
}
