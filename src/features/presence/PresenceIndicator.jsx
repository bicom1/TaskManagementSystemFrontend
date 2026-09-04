import { cn } from '@/lib/utils';
import { usePresenceStore } from '@/features/presence/presenceStore';
import { formatDistanceToNow } from 'date-fns';

/**
 * Live online/offline indicator with optional last-seen label.
 * Online is ONLY from Socket.IO presence — never inferred from lastLoginAt.
 */
export function PresenceIndicator({
  userId,
  person,
  showLabel = true,
  className,
  size = 'sm',
}) {
  const id = String(userId || person?._id || '');
  const live = usePresenceStore((s) => s.byId[id]);
  const inactive = person?.isActive === false;
  const invited = Boolean(person?.invitePending);

  let status = 'offline';
  let lastSeen = live?.lastSeen || person?.lastSeenAt || person?.lastLoginAt || null;

  if (inactive) status = 'inactive';
  else if (invited) status = 'invited';
  else if (live?.status === 'online') {
    status = 'online';
    lastSeen = null;
  } else {
    status = 'offline';
  }

  const dot =
    status === 'online'
      ? 'bg-emerald-500'
      : status === 'inactive'
        ? 'bg-amber-400'
        : status === 'invited'
          ? 'bg-sky-400'
          : 'bg-gray-900';

  const label =
    status === 'online'
      ? 'Online'
      : status === 'inactive'
        ? 'Deactivated'
        : status === 'invited'
          ? 'Invited'
          : lastSeen
            ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
            : 'Offline';

  const dotSize = size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2';

  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-1.5 text-[11px] text-graphite', className)}
      title={label}
    >
      <span className={cn('shrink-0 rounded-full', dotSize, dot)} aria-hidden />
      {showLabel ? <span className="truncate">{label}</span> : null}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Compact status badge for avatars (green = online, black = offline).
 */
export function PresenceAvatarDot({ userId, person, className }) {
  const id = String(userId || person?._id || '');
  const live = usePresenceStore((s) => s.byId[id]);
  const inactive = person?.isActive === false;

  const online = !inactive && live?.status === 'online';
  const lastSeen = live?.lastSeen || person?.lastSeenAt || person?.lastLoginAt || null;
  const title = online
    ? 'Online'
    : lastSeen
      ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
      : 'Offline';

  return (
    <span
      className={cn(
        'absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-white',
        online ? 'bg-emerald-500' : 'bg-gray-900',
        className
      )}
      title={title}
      aria-label={title}
    />
  );
}
