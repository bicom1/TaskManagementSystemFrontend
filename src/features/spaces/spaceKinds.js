/** Project routing helpers — legacy "space" kinds still open under /projects */

const SPACE_KINDS = new Set(['space']);
const LEGACY_SPACE_KINDS = new Set(['list']);

export function isSpaceKind(kind) {
  const k = kind || 'project';
  return SPACE_KINDS.has(k) || LEGACY_SPACE_KINDS.has(k);
}

export function isProjectKind() {
  return true;
}

export function spacePath(id, view = 'list') {
  return projectPath(id, view);
}

export function projectPath(id, view = 'list') {
  return `/projects/${id}?view=${view}`;
}

export function entityPath(entity) {
  if (!entity?._id) return '/projects';
  return projectPath(entity._id);
}
