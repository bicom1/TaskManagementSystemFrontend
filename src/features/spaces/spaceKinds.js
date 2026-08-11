/** Spaces vs Projects — shared kind helpers */

const SPACE_KINDS = new Set(['space']);
/** Legacy Space wizard saved kind: 'list' — still show under Spaces */
const LEGACY_SPACE_KINDS = new Set(['list']);

export function isSpaceKind(kind) {
  const k = kind || 'project';
  return SPACE_KINDS.has(k) || LEGACY_SPACE_KINDS.has(k);
}

export function isProjectKind(kind) {
  return !isSpaceKind(kind);
}

export function spacePath(id, view = 'list') {
  return `/spaces/${id}?view=${view}`;
}

export function projectPath(id, view = 'list') {
  return `/projects/${id}?view=${view}`;
}

export function entityPath(entity) {
  if (!entity?._id) return '/projects';
  return isSpaceKind(entity.kind) ? spacePath(entity._id) : projectPath(entity._id);
}
