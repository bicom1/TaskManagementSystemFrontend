import { CheckCircle2, Circle, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/UserAvatar';
import { formatInboxDate, statusColorFromLabel, statusLabel } from '../inboxUtils';
import { cn } from '@/lib/utils';

function StatusChip({ label, className }) {
  if (!label) return null;
  const color = statusColorFromLabel(label);
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className={cn('h-2.5 w-2.5 rounded-sm', color)} />
      <span>{statusLabel(label) || label}</span>
    </span>
  );
}

export function InboxActivityRow({ item, onOpen, onClear, clearTitle = 'Clear notification' }) {
  const { notification, taskTitle, actionText, isHighPriority, isCompleted, isIncoming } = item;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 border-b border-gray-100 px-4 py-3.5 transition hover:bg-gray-50/80',
        !item.isRead && 'bg-brand-50/20'
      )}
    >
      <button
        type="button"
        onClick={() => onClear?.(item)}
        className="mt-0.5 shrink-0 text-gray-300 transition hover:text-emerald-500"
        title={clearTitle}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          type="button"
          onClick={() => onOpen?.(item)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-[14px] font-semibold text-gray-900">{taskTitle}</p>
          {item.projectName && item.href && (
            <Link
              to={item.href}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 inline-block truncate text-[11px] font-medium text-brand-600 hover:underline"
            >
              {item.projectName}
            </Link>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gray-500">
            {item.sender && (
              <UserAvatar user={item.sender} size="xs" className="h-5 w-5 shrink-0" />
            )}
            {notification?.type === 'task_status_changed' && (item.statusFrom || item.statusTo) ? (
              <span className="inline-flex flex-wrap items-center gap-1">
                <span className="text-gray-400">@</span>
                <span>{item.sender?.name || 'Someone'}</span>
                <span>changed status:</span>
                {item.statusFrom && <StatusChip label={item.statusFrom} />}
                {item.statusFrom && item.statusTo && <span>→</span>}
                {item.statusTo && <StatusChip label={item.statusTo} />}
              </span>
            ) : (
              <span className="min-w-0 truncate">{actionText}</span>
            )}
            {isIncoming && !item.isRead && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                New
              </span>
            )}
            {isCompleted && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                Completed
              </span>
            )}
          </div>
        </button>

        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
          <div className="flex items-center gap-2">
            {isHighPriority && <Flag className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />}
            <span className="text-[12px] tabular-nums text-gray-400">
              {formatInboxDate(item.createdAt)}
            </span>
          </div>
          {item.href && (
            <Link
              to={item.href}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100 hover:underline"
            >
              Open task →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
