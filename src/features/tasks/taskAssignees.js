import { toast } from 'sonner';

/** Max people that can be assigned to a single task at once. */
export const MAX_TASK_ASSIGNEES = 3;

/**
 * Toggle a person in/out of an assignee id list, enforcing MAX_TASK_ASSIGNEES.
 * @returns {string[]|null} next id list, or null if the add was blocked by the cap
 */
export function toggleAssigneeId(currentIds, personId) {
  const id = String(personId);
  const current = (currentIds || []).map(String);
  if (current.includes(id)) return current.filter((x) => x !== id);
  if (current.length >= MAX_TASK_ASSIGNEES) {
    toast.error(`A task can have at most ${MAX_TASK_ASSIGNEES} assignees. Remove one to add another.`);
    return null;
  }
  return [...current, id];
}
