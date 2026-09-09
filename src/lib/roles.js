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

/**
 * Every department the workspace can see or pick.
 *
 * This used to return only the three built-in codes (seo / development / designing),
 * which silently discarded every department created through the UI — they saved fine
 * but never appeared in the department cards, the Create Team dropdown, or the invite
 * picker, so a custom department was unusable.
 *
 * Built-ins keep their canonical labels and lead the list; custom departments follow,
 * alphabetically. The API already filters out deactivated ones.
 */
export function getSelectableDepartments(departments) {
  const list = departments ?? [];
  const seen = new Set();
  const builtIns = [];
  const custom = [];

  for (const dept of list) {
    if (!dept) continue;
    const code = normalizeDepartmentCode(dept.code);
    if (!code || seen.has(code)) continue;
    seen.add(code);

    if (MAIN_DEPARTMENT_CODES.includes(code)) {
      // Stored name wins so renaming a built-in department actually shows;
      // the canonical label is only a fallback for rows with no name.
      builtIns.push({ ...dept, code, name: dept.name || DEPARTMENT_CODE_LABELS[code] });
    } else {
      custom.push({ ...dept, code, name: dept.name || code });
    }
  }

  builtIns.sort(
    (a, b) => MAIN_DEPARTMENT_CODES.indexOf(a.code) - MAIN_DEPARTMENT_CODES.indexOf(b.code)
  );
  custom.sort((a, b) =>
    String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' })
  );

  return [...builtIns, ...custom];
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
  // Custom departments get the same roles as the built-ins — the old fallback
  // silently dropped Superadmin, so nobody could be invited as one into a
  // department created through the UI. Who may *grant* each role is still gated
  // separately by getInvitableRoles(actorRole).
  return DEPARTMENT_ALLOWED_ROLES[code]
    ? [...DEPARTMENT_ALLOWED_ROLES[code]]
    : [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MEMBER];
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
