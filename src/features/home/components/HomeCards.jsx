import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/features/tasks/api/taskApi';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export function HomeCard({ title, action, children, className, accent = false }) {
  return (
    <section
      className={cn(
        'group flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-hairline bg-paper transition-shadow duration-200 hover:shadow-[var(--shadow-soft-lift)]',
        accent && 'border-primary/20 ring-1 ring-primary/10',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline/80 bg-cloud/40 px-4 py-3.5">
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
        {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      </div>
      <div className="flex-1 p-2.5 sm:p-3">{children}</div>
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
      className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-cloud"
    >
      <span className="mt-0.5 min-w-[3.25rem] font-mono text-[10px] font-semibold uppercase tracking-wide text-graphite/80">
        {task.key}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{task.title}</p>
        <p className="mt-0.5 truncate text-xs text-graphite">
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
            'shrink-0 rounded-md px-1.5 py-0.5 text-xs',
            overdue
              ? 'bg-bloom-coral/10 font-semibold text-bloom-coral'
              : isToday(due)
                ? 'bg-primary-soft/50 font-medium text-primary-deep'
                : 'text-graphite'
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
    <div className="flex h-full min-h-[120px] items-center justify-center px-4 py-8">
      <p className="max-w-[240px] text-center text-sm leading-relaxed text-graphite">{children}</p>
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
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-cloud"
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        <p className="truncate text-xs text-graphite">{item.subtitle || 'Recent'}</p>
      </div>
      {item.at ? (
        <span className="text-[11px] text-graphite">
          {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
        </span>
      ) : null}
    </Link>
  );
}

export function HomeStat({ label, value, tone = 'default', onClick }) {
  const tones = {
    default: 'border-hairline bg-paper text-ink',
    primary: 'border-primary/20 bg-primary-soft/30 text-primary-deep',
    warn: 'border-bloom-coral/20 bg-bloom-coral/5 text-bloom-deep',
    muted: 'border-hairline bg-cloud/80 text-charcoal',
  };

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border px-4 py-3 text-left transition-all',
        tones[tone] || tones.default,
        onClick && 'hover:shadow-[var(--shadow-soft-lift)] cursor-pointer'
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-graphite">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </Comp>
  );
}
