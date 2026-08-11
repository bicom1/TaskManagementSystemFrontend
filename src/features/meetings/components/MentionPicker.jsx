import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, FileText, Hash, MapPin, Users, X } from 'lucide-react';
import { getAvatarColor, getInitials, getPersonStatus } from '@/lib/avatar';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'people', label: 'People', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'docs', label: 'Docs', icon: FileText },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'channels', label: 'Channels', icon: Hash },
];

const STATUS_DOT = {
  online: 'bg-emerald-500',
  active: 'bg-emerald-400',
  offline: 'border-2 border-[#c8c8c8] bg-white',
  invited: 'bg-amber-400',
  inactive: 'bg-[#c8c8c8]',
};

function matches(haystack, query) {
  if (!query) return true;
  return String(haystack || '')
    .toLowerCase()
    .includes(String(query).toLowerCase());
}

function PersonRow({ person, label, selected, onSelect }) {
  const status = getPersonStatus(person);
  const color = getAvatarColor(person._id || person.email || person.name);
  return (
    <button
      type="button"
      onClick={() => onSelect(person)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition',
        selected ? 'bg-[#f0f0f0]' : 'hover:bg-[#f5f5f5]'
      )}
    >
      <span className="relative shrink-0">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {getInitials(person.name)}
        </span>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full',
            STATUS_DOT[status] || STATUS_DOT.offline
          )}
        />
      </span>
      <span className="truncate text-sm font-medium text-[#292929]">{label}</span>
    </button>
  );
}

function SimpleRow({ icon: Icon, title, subtitle, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition',
        selected ? 'bg-[#f0f0f0]' : 'hover:bg-[#f5f5f5]'
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3f3f3] text-[#5a5a5a]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[#292929]">{title}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-graphite">{subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * ClickUp-style @ mention picker for Meetings AI search.
 */
export function MentionPicker({
  open,
  onClose,
  query = '',
  currentUser,
  people = [],
  tasks = [],
  docs = [],
  locations = [],
  channels = [],
  onSelect,
}) {
  const [tab, setTab] = useState('people');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setTab('people');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [tab, query]);

  const peopleItems = useMemo(() => {
    const uid = String(currentUser?._id || '');
    const sorted = [...people].sort((a, b) => {
      const aMe = String(a._id) === uid ? -1 : 0;
      const bMe = String(b._id) === uid ? -1 : 0;
      if (aMe !== bMe) return aMe - bMe;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    return sorted
      .filter((p) => matches(p.name, query) || matches(p.email, query))
      .slice(0, 12)
      .map((p) => ({
        type: 'people',
        id: p._id,
        label: String(p._id) === uid ? 'Me' : p.name,
        insert: String(p._id) === uid ? `@${p.name || 'me'}` : `@${p.name}`,
        person: p,
      }));
  }, [people, currentUser, query]);

  const taskItems = useMemo(
    () =>
      tasks
        .filter((t) => matches(t.title, query))
        .slice(0, 12)
        .map((t) => ({
          type: 'tasks',
          id: t._id,
          label: t.title,
          subtitle: t.project?.name || t.status,
          insert: `@task:${t.title}`,
          icon: CheckSquare,
        })),
    [tasks, query]
  );

  const docItems = useMemo(
    () =>
      docs
        .filter((d) => matches(d.title || d.name, query))
        .slice(0, 12)
        .map((d) => ({
          type: 'docs',
          id: d._id || d.refId,
          label: d.title || d.name,
          subtitle: d.subtitle || d.team?.name,
          insert: `@doc:${d.title || d.name}`,
          icon: FileText,
        })),
    [docs, query]
  );

  const locationItems = useMemo(
    () =>
      locations
        .filter((l) => matches(l.name, query) || matches(l.city, query))
        .slice(0, 12)
        .map((l) => ({
          type: 'locations',
          id: l._id,
          label: l.name,
          subtitle: [l.city, l.type].filter(Boolean).join(' · '),
          insert: `@location:${l.name}`,
          icon: MapPin,
        })),
    [locations, query]
  );

  const channelItems = useMemo(
    () =>
      channels
        .filter((c) => matches(c.name, query))
        .slice(0, 12)
        .map((c) => ({
          type: 'channels',
          id: c._id,
          label: c.name,
          subtitle: c.department?.name,
          insert: `@${c.name}`,
          icon: Hash,
        })),
    [channels, query]
  );

  const itemsByTab = {
    people: peopleItems,
    tasks: taskItems,
    docs: docItems,
    locations: locationItems,
    channels: channelItems,
  };

  const items = itemsByTab[tab] || [];
  const sectionLabel = TABS.find((t) => t.id === tab)?.label || 'Results';

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && items[activeIndex]) {
        e.preventDefault();
        onSelect?.(items[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, activeIndex, onClose, onSelect]);

  if (!open) return null;

  return (
    <div
      className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-[#e6e6e6] bg-white text-left shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
      role="listbox"
      aria-label="Mention picker"
    >
      <div className="flex items-center justify-between border-b border-[#eee] px-1">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 pt-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm transition',
                tab === t.id
                  ? 'border-[#1f1f1f] font-semibold text-[#1f1f1f]'
                  : 'border-transparent font-medium text-[#8a8a8a] hover:text-[#4a4a4a]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mr-1 rounded-md p-1.5 text-[#8a8a8a] hover:bg-[#f3f3f3] hover:text-[#1f1f1f]"
          aria-label="Hide mentions"
          title="Hide"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto px-1.5 py-2">
        <p className="px-2.5 pb-1.5 text-xs font-medium text-[#9a9a9a]">{sectionLabel}</p>
        {items.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-sm text-graphite">No matches</p>
        ) : tab === 'people' ? (
          items.map((item, index) => (
            <PersonRow
              key={item.id}
              person={item.person}
              label={item.label}
              selected={index === activeIndex}
              onSelect={() => onSelect?.(item)}
            />
          ))
        ) : (
          items.map((item, index) => (
            <SimpleRow
              key={item.id}
              icon={item.icon}
              title={item.label}
              subtitle={item.subtitle}
              selected={index === activeIndex}
              onSelect={() => onSelect?.(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function MentionAtButton({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-md p-1.5 transition',
        active
          ? 'bg-[#f0f0f0] text-[#1f1f1f]'
          : 'text-graphite hover:bg-cloud hover:text-ink'
      )}
      aria-label={active ? 'Hide mentions' : 'Mention someone'}
      aria-pressed={active}
      title={active ? 'Hide @ mentions' : 'Mention'}
    >
      <AtSignIcon crossed={active} />
    </button>
  );
}

function AtSignIcon({ crossed }) {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
      </svg>
      {crossed ? (
        <span className="pointer-events-none absolute inset-[-2px] flex items-center justify-center">
          <span className="h-[1.5px] w-[18px] rotate-[-45deg] rounded-full bg-current" />
        </span>
      ) : null}
    </span>
  );
}
