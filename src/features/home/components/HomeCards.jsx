import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/features/tasks/api/taskApi';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export function HomeCard({ title, action, children, className }) {
  return (
    <section
      className={cn(
        'flex min-h-[180px] flex-col rounded-xl border border-hairline bg-paper shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
        <h3 className="text-lg font-bold leading-none tracking-tight text-ink">{title}</h3>
        {action && <div className="flex shrink-0 items-center">{action}</div>}
      </div>
      <div className="flex-1 p-3">{children}</div>
    </section>
  );
}

export function TaskRow({ task, onOpen }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = due && isPast(due) && !isToday(due) && task.status !== 'done';

  return (
    <button
      type="button"
      onClick={() => onOpen?.(task)}
      className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-cloud"
    >
      <span className="mt-0.5 text-[10px] font-bold uppercase text-graphite">{task.key}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{task.title}</p>
        <p className="truncate text-xs text-graphite">
          {task.project?.name || 'Project'} · {STATUS_LABELS[task.status] || task.status}
        </p>
      </div>
      {task.priority && (
        <Badge
          variant={task.priority === 'urgent' || task.priority === 'high' ? 'warning' : 'secondary'}
        >
          {PRIORITY_LABELS[task.priority] || task.priority}
        </Badge>
      )}
      {due && (
        <span className={cn('shrink-0 text-xs', overdue ? 'font-semibold text-bloom-coral' : 'text-graphite')}>
          {isToday(due) ? 'Today' : format(due, 'MMM d')}
        </span>
      )}
    </button>
  );
}

export function EmptyCardLine({ children }) {
  return <p className="px-2 py-6 text-center text-sm text-graphite">{children}</p>;
}

export function RecentRow({ item }) {
  const to =
    item.type === 'project'
      ? `/projects/${item.refId || item.projectId}`
      : item.projectId
        ? `/projects/${item.projectId}`
        : '/projects';

  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-cloud"
    >
      <span className="h-2 w-2 shrink-0 rounded-sm bg-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        <p className="truncate text-xs text-graphite">{item.subtitle || 'Recent'}</p>
      </div>
      {item.at && (
        <span className="text-[11px] text-graphite">
          {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
        </span>
      )}
    </Link>
  );
}