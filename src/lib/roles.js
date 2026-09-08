export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',

  // Legacy aliases → canonical values (existing imports keep working)
  SUPER_ADMIN: 'SUPERADMIN',
  DEPT_HEAD: 'ADMIN',
  TEAM_LEAD: 'ADMIN',
  EXECUTIVE: 'MEMBER',
  EMPLOYEE: 'MEMBER',
};

export const ROLE_VALUES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MEMBER];

export const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: 'Superadmin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MEMBER]: 'Member',
};

export function normalizeRole(role) {
  const raw = String(role || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  const map = {
    SUPERADMIN: ROLES.SUPERADMIN,
    SUPER_ADMIN: ROLES.SUPERADMIN,
    ADMIN: ROLES.ADMIN,
    DEPT_HEAD: ROLES.ADMIN,
    TEAM_LEAD: ROLES.ADMIN,
    MANAGER: ROLES.ADMIN,
    MEMBER: ROLES.MEMBER,
    EMPLOYEE: ROLES.MEMBER,
    EXECUTIVE: ROLES.MEMBER,
    USER: ROLES.MEMBER,
  };
  if (map[raw]) return map[raw];
  const lower = String(role || '').trim().toLowerCase();
  const lowerMap = {
    superadmin: ROLES.SUPERADMIN,
    super_admin: ROLES.SUPERADMIN,
    admin: ROLES.ADMIN,
    dept_head: ROLES.ADMIN,
    team_lead: ROLES.ADMIN,
    manager: ROLES.ADMIN,
    member: ROLES.MEMBER,
    employee: ROLES.MEMBER,
    executive: ROLES.MEMBER,
    user: ROLES.MEMBER,
  };
  return lowerMap[lower] || ROLES.MEMBER;
}

/** @deprecated Prefer getInvitableRoles(actorRole) from permissions.js */
export const INVITE_ROLES = [ROLES.ADMIN, ROLES.MEMBER];

export const DEPARTMENT_CODES = {
  SEO: 'seo',
  DEVELOPMENT: 'development',
  DESIGNING: 'designing',
};

export const DEPARTMENT_CODE_LABELS = {
  [DEPARTMENT_CODES.SEO]: 'SEO',
  [DEPARTMENT_CODES.DEVELOPMENT]: 'Development',
  [DEPARTMENT_CODES.DESIGNING]: 'UI/UX Designing',
};

export const MAIN_DEPARTMENT_CODES = [
  DEPARTMENT_CODES.SEO,
  DEPARTMENT_CODES.DEVELOPMENT,
  DEPARTMENT_CODES.DESIGNING,
];

export const DEPARTMENT_PRESETS = [
  { code: DEPARTMENT_CODES.SEO, name: 'SEO' },
  { code: DEPARTMENT_CODES.DEVELOPMENT, name: 'Development' },
  { code: DEPARTMENT_CODES.DESIGNING, name: 'UI/UX Designing' },
];

export function resolveDepartmentCode(deptOrCode) {
  if (!deptOrCode) return '';
  if (typeof deptOrCode === 'string') {
    const raw = normalizeDepartmentCode(deptOrCode);
    if (MAIN_DEPARTMENT_CODES.includes(raw)) return raw;
    const asName = String(deptOrCode).trim().toLowerCase();
    if (asName.includes('seo')) return DEPARTMENT_CODES.SEO;
    if (asName.includes('develop') || asName === 'dev') return DEPARTMENT_CODES.DEVELOPMENT;
    if (asName.includes('ui') || asName.includes('ux') || asName.includes('design')) {
      return DEPARTMENT_CODES.DESIGNING;
    }
    return raw;
  }
  const fromCode = normalizeDepartmentCode(deptOrCode.code);
  if (MAIN_DEPARTMENT_CODES.includes(fromCode)) return fromCode;
  return resolveDepartmentCode(deptOrCode.name || '');
}

export function getMainDepartments(departments) {
  const list = departments ?? [];
  const byCode = new Map();
  for (const d of list) {
    const code = resolveDepartmentCode(d);
    if (!code || byCode.has(code)) continue;
    if (MAIN_DEPARTMENT_CODES.includes(code)) byCode.set(code, d);
  }

  return MAIN_DEPARTMENT_CODES.map((code) => {
    const dept = byCode.get(code);
    if (!dept) return null;
    return {
      ...dept,
      code,
      name: DEPARTMENT_CODE_LABELS[code] || dept.name,
    };
  }).filter(Boolean);
}

export const DEPARTMENT_ALLOWED_ROLES = {
  [DEPARTMENT_CODES.SEO]: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MEMBER],
  [DEPARTMENT_CODES.DEVELOPMENT]: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MEMBER],
  [DEPARTMENT_CODES.DESIGNING]: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MEMBER],
};

export const INVITE_ROLE_LABELS = {
  [DEPARTMENT_CODES.SEO]: {
    [ROLES.SUPERADMIN]: 'Superadmin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.MEMBER]: 'Member',
  },
  [DEPARTMENT_CODES.DEVELOPMENT]: {
    [ROLES.SUPERADMIN]: 'Superadmin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.MEMBER]: 'Member',
  },
  [DEPARTMENT_CODES.DESIGNING]: {
    [ROLES.SUPERADMIN]: 'Superadmin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.MEMBER]: 'Member',
  },
};

export const JOB_TITLE_SUGGESTIONS = {
  [DEPARTMENT_CODES.SEO]: {
    [ROLES.SUPERADMIN]: ['Superadmin'],
    [ROLES.ADMIN]: ['SEO Admin', 'SEO Manager'],
    [ROLES.MEMBER]: ['SEO Analyst', 'SEO Associate', 'Content SEO'],
  },
  [DEPARTMENT_CODES.DEVELOPMENT]: {
    [ROLES.SUPERADMIN]: ['Superadmin'],
    [ROLES.ADMIN]: ['Engineering Admin', 'Tech Admin'],
    [ROLES.MEMBER]: [
      'Software Developer',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
    ],
  },
  [DEPARTMENT_CODES.DESIGNING]: {
    [ROLES.SUPERADMIN]: ['Superadmin'],
    [ROLES.ADMIN]: ['Design Admin'],
    [ROLES.MEMBER]: ['UI/UX Designer', 'Product Designer', 'Visual Designer'],
  },
};

export const APPROVAL_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function canInvite(role) {
  const r = normalizeRole(role);
  return r === ROLES.SUPERADMIN || r === ROLES.ADMIN;
}

export function canManageOrg(role) {
  return normalizeRole(role) === ROLES.SUPERADMIN;
}

export function canApproveTasks(role) {
  const r = normalizeRole(role);
  return r === ROLES.SUPERADMIN || r === ROLES.ADMIN;
}

export function canDeleteProject(role) {
  return normalizeRole(role) === ROLES.SUPERADMIN;
}

export function getRoleLabel(role) {
  const r = normalizeRole(role);
  return ROLE_LABELS[r] ?? String(role || '').replace(/_/g, ' ') ?? '—';
}

export function normalizeDepartmentCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 50);
}

export function getAllowedRolesForDepartment(deptCode) {
  const code = normalizeDepartmentCode(deptCode);
  return DEPARTMENT_ALLOWED_ROLES[code]
    ? [...DEPARTMENT_ALLOWED_ROLES[code]]
    : [ROLES.ADMIN, ROLES.MEMBER];
}

export function getInviteRoleLabel(deptCode, role) {
  const code = normalizeDepartmentCode(deptCode);
  const r = normalizeRole(role);
  return INVITE_ROLE_LABELS[code]?.[r] || getRoleLabel(r);
}

export function getJobTitleSuggestions(deptCode, role) {
  const code = normalizeDepartmentCode(deptCode);
  const r = normalizeRole(role);
  return JOB_TITLE_SUGGESTIONS[code]?.[r] ? [...JOB_TITLE_SUGGESTIONS[code][r]] : [];
}

export function getDefaultJobTitle(deptCode, role) {
  return getJobTitleSuggestions(deptCode, role)[0] || '';
}

export function getInvitableRolesForDepartment(actorRole, deptCode, invitableByActor) {
  const byActor = invitableByActor || [];
  if (!deptCode) return byActor;
  const allowed = new Set(getAllowedRolesForDepartment(deptCode));
  return byActor.filter((r) => allowed.has(normalizeRole(r)));
}

export function groupTeamsByDepartment(teams, departments) {
  const deptMap = new Map(
    (departments ?? []).map((d) => [d._id, d.name ?? DEPARTMENT_CODE_LABELS[d.code] ?? 'Other'])
  );
  const groups = new Map();

  for (const team of teams ?? []) {
    const deptId = team.department?._id ?? team.department ?? 'unknown';
    const deptName =
      team.department?.name ??
      deptMap.get(deptId) ??
      DEPARTMENT_CODE_LABELS[team.department?.code] ??
      'Other';
    if (!groups.has(deptId)) {
      groups.set(deptId, { id: deptId, name: deptName, teams: [] });
    }
    groups.get(deptId).teams.push(team);
  }

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
}
