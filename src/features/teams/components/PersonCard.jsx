import { getAvatarColor, getInitials, getPersonStatus } from '@/lib/avatar';
import { getRoleLabel } from '@/lib/roles';
import { cn } from '@/lib/utils';

const STATUS_DOT = {
  online: 'bg-emerald-500',
  active: 'bg-emerald-400/80',
  offline: 'border border-steel bg-transparent',
  invited: 'bg-amber-400',
  inactive: 'bg-steel',
};

export function PersonCard({ person, onClick, compact = false }) {
  const initials = getInitials(person.name);
  const color = getAvatarColor(person._id || person.email || person.name);
  const status = getPersonStatus(person);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(person)}
        className="flex w-full items-center gap-3 rounded-lg border border-hairline bg-paper px-3 py-2.5 text-left transition hover:border-steel hover:shadow-sm"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
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
      className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-paper text-left shadow-sm transition hover:border-steel hover:shadow-md"
    >
      <div
        className="flex aspect-[5/4] w-full items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <span className="select-none text-5xl font-bold tracking-tight text-white/95 sm:text-6xl">
          {initials}
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-3">
        <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
        <span
          className={cn('h-2.5 w-2.5 shrink-0 rounded-full', STATUS_DOT[status])}
          title={status}
        />
      </div>
    </button>
  );
}
