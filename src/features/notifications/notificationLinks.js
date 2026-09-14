/**
 * Where a notification's non-task entity lives in the app.
 *
 * The inbox row, the inbox feed fallback, and the live toast each used to build
 * this link on their own, and all three only knew 'Project'. Team and department
 * notifications were stored as 'Project' too, so clicking "You were added to
 * team X" opened /projects/<team id> — a "project not found" page. Keep every
 * notification link going through here.
 *
 * Tasks are resolved separately: their route needs the parent project id.
 */
export function entityHref(entityType, entityId) {
  if (!entityId) return null;
  switch (entityType) {
    case 'Project':
      return `/projects/${entityId}?view=list`;
    case 'Team':
      return `/teams/${entityId}`;
    case 'Department':
      // Members land on People; admins see the teams catalog.
      return '/teams/people';
    case 'User':
      return '/teams/people';
    default:
      return null;
  }
}
