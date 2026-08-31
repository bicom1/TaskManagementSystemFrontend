import { getAvatarColor, getInitials, getPersonStatus } from '@/lib/avatar';
import { getRoleLabel } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';

const STATUS_DOT = {
  online: 'bg-emerald-500',
  active: 'bg-emerald-400/80',
  offline: 'border border-steel bg-transparent',
  invited: 'bg-amber-400',
  inactive: 'bg-steel',
};

export function PersonCard({ person, onClick, compact = false }) {
  const status = getPersonStatus(person);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(person)}
        className="flex w-full items-center gap-3 rounded-lg border border-hairline bg-paper px-3 py-2.5 text-left transition hover:border-steel hover:shadow-sm"
      >
        <UserAvatar user={person} size="lg" rounded="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-ink">{person.name}</p>
            <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[status])} />
          </div>
          <p className="truncate text-xs text-graphite">
            {person.jobTitle || getRoleLabel(person.role)}
            {person.department?.name ? ` · ${person.department.name}` : ''}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(person)}
      className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-paper text-left shadow-xs transition-[border-color,box-shadow] hover:border-border-base hover:shadow-md"
    >
      <div className="relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden bg-cloud">
        {person.avatarUrl ? (
          <img
            src={person.avatarUrl}
            alt={person.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: getAvatarColor(person._id || person.email || person.name) }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.10), rgba(0,0,0,0.14))' }}
            />
            <span className="relative select-none text-[2.5rem] font-semibold tracking-tight text-white sm:text-5xl">
              {getInitials(person.name)}
            </span>
          </div>
        )}
      </div>
      <div className="min-w-0 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-ink">{person.name}</p>
          <span
            className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[status])}
            title={status}
          />
        </div>
        <p className="mt-0.5 truncate text-[11.5px] text-graphite">
          {person.jobTitle || getRoleLabel(person.role)}
        </p>
      </div>
    </button>
  );
}
