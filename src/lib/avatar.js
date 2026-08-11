/** Deterministic ClickUp-style avatar colors from a name */
const AVATAR_COLORS = [
  '#e91e8c', // hot pink
  '#2d3436', // dark gray
  '#00b894', // teal
  '#e17055', // orange
  '#a29b7c', // taupe
  '#6c5ce7', // purple
  '#0984e3', // blue
  '#d63031', // red
  '#00cec9', // cyan
  '#fdcb6e', // gold
  '#636e72', // slate
  '#e84393', // magenta
];

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getAvatarColor(seed = '') {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Derive presence-style status for UI filters */
export function getPersonStatus(person) {
  if (person?.invitePending) return 'invited';
  if (!person?.isActive) return 'inactive';
  if (person?.lastLoginAt) {
    const age = Date.now() - new Date(person.lastLoginAt).getTime();
    if (age < 15 * 60 * 1000) return 'online';
    if (age < 7 * 24 * 60 * 60 * 1000) return 'active';
  }
  return 'offline';
}

export const PERSON_STATUS_LABELS = {
  online: 'Online',
  active: 'Active',
  offline: 'Offline',
  invited: 'Invited',
  inactive: 'Inactive',
};
