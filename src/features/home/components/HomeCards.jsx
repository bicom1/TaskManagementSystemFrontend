import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/features/tasks/api/taskApi';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export function HomePanel({ title, count, action, children, className }) {
  return (
    <section
      className={cn(
        'flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-hairline bg-paper shadow-soft-lift',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-cloud/30 px-4 py-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="truncate text-sm font-semibold tracking-tight text-ink">{title}</h3>
          {typeof count === 'number' ? (
            <span className="rounded-md bg-paper px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-graphite shadow-soft-lift">
              {count}
            </span>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{children}</div>
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
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-cloud"
    >
      <span className="w-14 shrink-0 truncate font-mono text-[10px] font-semibold uppercase text-graphite">
        {task.key}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{task.title}</p>
        <p className="truncate text-xs text-graphite">
          {task.project?.name || 'Project'} · {STATUS_LABELS[task.status] || task.status}
        </p>
      </div>
      {task.priority ? (
        <Badge
          variant={task.priority === 'urgent' || task.priority === 'high' ? 'warning' : 'secondary'}
        >
          {PRIORITY_LABELS[task.priority] || task.priority}
        </Badge>
      ) : null}
      {due ? (
        <span
          className={cn(
            'w-14 shrink-0 text-right text-xs tabular-nums',
            overdue ? 'font-semibold text-bloom-coral' : 'text-graphite'
          )}
        >
          {isToday(due) ? 'Today' : format(due, 'MMM d')}
        </span>
      ) : null}
    </button>
  );
}

export function EmptyCardLine({ children }) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center px-6">
      <p className="text-center text-sm text-graphite">{children}</p>
    </div>
  );
}

export function RecentRow({ item }) {
  const to =
    item.type === 'project'
      ? `/projects/${item.refId || item.projectId}`
      : item.projectId
        ? `/projects/${item.projectId}`
        : '/projects';

  return (
    <Link to={to} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-cloud">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        <p className="truncate text-xs text-graphite">{item.subtitle || 'Recent'}</p>
      </div>
      {item.at ? (
        <span className="shrink-0 text-[11px] text-graphite">
          {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
        </span>
      ) : null}
    </Link>
  );
}

/** @deprecated use HomePanel */
export function HomeCard(props) {
  return <HomePanel {...props} />;
}

export function HomeStat({ label, value, onClick, alert = false }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col border-r border-hairline px-4 py-3 text-left last:border-r-0',
        onClick && 'hover:bg-cloud/80'
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-graphite">{label}</span>
      <span
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums tracking-tight',
          alert ? 'text-bloom-coral' : 'text-ink'
        )}
      >
        {value}
      </span>
    </Comp>
  );
}
