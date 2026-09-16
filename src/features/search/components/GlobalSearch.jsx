import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, ListTodo, Search, Users, UsersRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { UserAvatar } from '@/components/UserAvatar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useWorkspaceSearch } from '@/features/search/hooks/useSearch';
import { getRoleLabel } from '@/lib/roles';
import { formatTaskTitle } from '@/features/tasks/taskTitle';
import { projectPath } from '@/features/spaces/spaceKinds';
import { cn } from '@/lib/utils';

function resultPath(item) {
  if (item.kind === 'person') return '/teams/people';
  if (item.kind === 'project') return projectPath(item.id);
  if (item.kind === 'team') return `/teams/${item.id}`;
  if (item.kind === 'task') {
    return item.projectId ? `/projects/${item.projectId}?task=${item.id}` : '/all-tasks';
  }
  return '/home';
}

function ResultIcon({ kind }) {
  if (kind === 'person') return <Users className="h-3.5 w-3.5 text-text-muted" />;
  if (kind === 'project') return <FolderKanban className="h-3.5 w-3.5 text-text-muted" />;
  if (kind === 'team') return <UsersRound className="h-3.5 w-3.5 text-text-muted" />;
  return <ListTodo className="h-3.5 w-3.5 text-text-muted" />;
}

export function GlobalSearch({ className }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const navigate = useNavigate();
  const debounced = useDebouncedValue(value, 220);
  const query = debounced.trim();
  const { data, isFetching } = useWorkspaceSearch(query);

  const rawGroups = useMemo(() => {
    if (!data) return [];
    const next = [];
    if (data.people?.length) {
      next.push({
        id: 'people',
        label: 'People',
        items: data.people.map((p) => ({
          kind: 'person',
          id: p.id,
          title: p.name,
          subtitle: [p.jobTitle || getRoleLabel(p.role), p.department].filter(Boolean).join(' · '),
          person: p,
        })),
      });
    }
    if (data.tasks?.length) {
      next.push({
        id: 'tasks',
        label: 'Tasks',
        items: data.tasks.map((t) => ({
          kind: 'task',
          id: t.id,
          title: `${t.key} · ${formatTaskTitle(t)}`,
          subtitle: t.project || t.projectKey || 'Task',
          projectId: t.projectId,
        })),
      });
    }
    if (data.projects?.length) {
      next.push({
        id: 'projects',
        label: 'Projects',
        items: data.projects.map((p) => ({
          kind: 'project',
          id: p.id,
          title: p.name,
          subtitle: p.key,
        })),
      });
    }
    if (data.teams?.length) {
      next.push({
        id: 'teams',
        label: 'Teams',
        items: data.teams.map((t) => ({
          kind: 'team',
          id: t.id,
          title: t.name,
          subtitle: t.department || 'Team',
        })),
      });
    }
    return next;
  }, [data]);

  const groups = useMemo(() => {
    let index = 0;
    return rawGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item, index: index++ })),
    }));
  }, [rawGroups]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  const go = (item) => {
    if (!item) return;
    navigate(resultPath(item));
    setValue('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!flat.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(flat[active] || flat[0]);
    }
  };

  const showPanel = open && value.trim().length > 0;

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search tasks, spaces, people…"
        className="h-8 rounded-lg border-transparent bg-surface-1 pl-8 pr-14 text-[12.5px] placeholder:text-text-muted hover:bg-surface-2 focus-visible:border-brand-400 focus-visible:bg-surface-0"
        aria-label="Search workspace"
        autoComplete="off"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 flex h-5 -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border-subtle bg-surface-0 px-1.5 text-[10px] font-semibold text-text-muted">
        {typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '')
          ? '⌘K'
          : 'Ctrl K'}
      </kbd>

      {showPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border-subtle bg-surface-0 shadow-[var(--shadow-2xl)]">
          {isFetching && !data ? (
            <p className="px-3 py-3 text-[12.5px] text-text-muted">Searching…</p>
          ) : flat.length === 0 ? (
            <p className="px-3 py-3 text-[12.5px] text-text-muted">
              No matches for “{query}”.
            </p>
          ) : (
            <div className="max-h-[min(420px,70vh)] overflow-y-auto py-1.5">
              {groups.map((group) => (
                <div key={group.id} className="px-1.5 py-1">
                  <p className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                      <button
                        key={`${item.kind}-${item.id}`}
                        type="button"
                        onMouseEnter={() => setActive(item.index)}
                        onClick={() => go(item)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left',
                          item.index === active ? 'bg-surface-2' : 'hover:bg-surface-1'
                        )}
                      >
                        {item.kind === 'person' ? (
                          <UserAvatar user={item.person} size="xs" className="h-6 w-6 rounded-md" />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-1">
                            <ResultIcon kind={item.kind} />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-medium text-text-primary">
                            {item.title}
                          </span>
                          {item.subtitle ? (
                            <span className="block truncate text-[11px] text-text-muted">
                              {item.subtitle}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
