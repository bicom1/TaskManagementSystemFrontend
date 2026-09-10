/**
 * Shared display helpers so subtasks read clearly across list, board, home, etc.
 */

export function isTaskSubtask(task) {
  if (!task) return false;
  if (task.parentTask == null || task.parentTask === '') return false;
  return true;
}

/** Plain title string, e.g. "Design homepage (Subtask)" */
export function formatTaskTitle(task, fallback = 'Untitled') {
  const title = String(task?.title || '').trim() || fallback;
  if (!isTaskSubtask(task)) return title;
  if (/\(subtask\)\s*$/i.test(title)) return title;
  return `${title} (Subtask)`;
}

/**
 * Professional title node: main name + muted bracket label for subtasks.
 * Prefer this in UI so "(Subtask)" stays visually secondary.
 */
export function TaskTitleDisplay({
  task,
  title,
  className = '',
  titleClassName = 'truncate font-medium text-ink',
  labelClassName = 'shrink-0 whitespace-nowrap text-[11px] font-medium text-graphite',
  as: Tag = 'span',
}) {
  const text = String(title ?? task?.title ?? '').trim() || 'Untitled';
  const subtask = isTaskSubtask(task);

  return (
    <Tag className={`inline-flex min-w-0 max-w-full items-baseline gap-1.5 ${className}`.trim()}>
      <span className={titleClassName}>{text}</span>
      {subtask ? <span className={labelClassName}>(Subtask)</span> : null}
    </Tag>
  );
}
