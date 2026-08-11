export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  DEPT_HEAD: 'dept_head',
  TEAM_LEAD: 'team_lead',
  EXECUTIVE: 'executive',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.DEPT_HEAD]: 'Department Head',
  [ROLES.TEAM_LEAD]: 'Team Lead',
  [ROLES.EXECUTIVE]: 'Executive',
  [ROLES.EMPLOYEE]: 'Employee',
};

/** @deprecated Prefer getInvitableRoles(actorRole) from permissions.js */
export const INVITE_ROLES = [
  ROLES.DEPT_HEAD,
  ROLES.TEAM_LEAD,
  ROLES.EXECUTIVE,
  ROLES.EMPLOYEE,
];

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

/** Ordered main departments shown in invite / org selects */
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

/** Map free-text / legacy names → built-in department code */
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

/** Prefer the three main departments, ordered SEO → Development → UI/UX Designing */
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


/** Roles allowed per department on invite */
export const DEPARTMENT_ALLOWED_ROLES = {
  [DEPARTMENT_CODES.SEO]: [
    ROLES.DEPT_HEAD,
    ROLES.TEAM_LEAD,
    ROLES.EXECUTIVE,
    ROLES.EMPLOYEE,
  ],
  [DEPARTMENT_CODES.DEVELOPMENT]: [ROLES.TEAM_LEAD, ROLES.EMPLOYEE],
  [DEPARTMENT_CODES.DESIGNING]: [ROLES.TEAM_LEAD, ROLES.EMPLOYEE],
};

export const INVITE_ROLE_LABELS = {
  [DEPARTMENT_CODES.SEO]: {
    [ROLES.DEPT_HEAD]: 'SEO Head',
    [ROLES.TEAM_LEAD]: 'Team Lead',
    [ROLES.EXECUTIVE]: 'Executive',
    [ROLES.EMPLOYEE]: 'Employee',
  },
  [DEPARTMENT_CODES.DEVELOPMENT]: {
    [ROLES.TEAM_LEAD]: 'Team Lead',
    [ROLES.EMPLOYEE]: 'Employee',
  },
  [DEPARTMENT_CODES.DESIGNING]: {
    [ROLES.TEAM_LEAD]: 'Team Lead',
    [ROLES.EMPLOYEE]: 'Employee',
  },
};

export const JOB_TITLE_SUGGESTIONS = {
  [DEPARTMENT_CODES.SEO]: {
    [ROLES.DEPT_HEAD]: ['SEO Head', 'Head of SEO'],
    [ROLES.TEAM_LEAD]: ['SEO Team Lead', 'SEO Lead'],
    [ROLES.EXECUTIVE]: ['SEO Executive', 'SEO Specialist'],
    [ROLES.EMPLOYEE]: ['SEO Analyst', 'SEO Associate', 'Content SEO'],
  },
  [DEPARTMENT_CODES.DEVELOPMENT]: {
    [ROLES.TEAM_LEAD]: ['Development Team Lead', 'Engineering Lead', 'Tech Lead'],
    [ROLES.EMPLOYEE]: [
      'Software Developer',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
    ],
  },
  [DEPARTMENT_CODES.DESIGNING]: {
    [ROLES.TEAM_LEAD]: ['UI/UX Team Lead', 'Design Lead'],
    [ROLES.EMPLOYEE]: ['UI/UX Designer', 'Product Designer', 'Visual Designer'],
  },
};

export const APPROVAL_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function canInvite(role) {
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.DEPT_HEAD ||
    role === ROLES.TEAM_LEAD
  );
}

export function canManageOrg(role) {
  return role === ROLES.SUPER_ADMIN;
}

export function canApproveTasks(role) {
  return (
    role === ROLES.SUPER_ADMIN ||
    role === ROLES.DEPT_HEAD ||
    role === ROLES.TEAM_LEAD
  );
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role?.replace(/_/g, ' ') ?? '—';
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
    : [ROLES.TEAM_LEAD, ROLES.EMPLOYEE];
}

export function getInviteRoleLabel(deptCode, role) {
  const code = normalizeDepartmentCode(deptCode);
  return INVITE_ROLE_LABELS[code]?.[role] || getRoleLabel(role);
}

export function getJobTitleSuggestions(deptCode, role) {
  const code = normalizeDepartmentCode(deptCode);
  return JOB_TITLE_SUGGESTIONS[code]?.[role]
    ? [...JOB_TITLE_SUGGESTIONS[code][role]]
    : [];
}

export function getDefaultJobTitle(deptCode, role) {
  return getJobTitleSuggestions(deptCode, role)[0] || '';
}

/** Roles an actor may invite into a department (actor rank ∩ dept matrix) */
export function getInvitableRolesForDepartment(actorRole, deptCode, invitableByActor) {
  const byActor = invitableByActor || [];
  if (!deptCode) return byActor;
  const allowed = new Set(getAllowedRolesForDepartment(deptCode));
  return byActor.filter((r) => allowed.has(r));
}

/** Group teams array by department for optgroup selects */
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
