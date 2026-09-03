import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, CornerDownLeft, Flag, UserRound, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { PRIORITY_LABELS } from '@/features/tasks/api/taskApi';
import { toggleAssigneeId } from '@/features/tasks/taskAssignees';

function priorityFlagClass(priority) {
  if (priority === 'urgent') return 'text-danger-500';
  if (priority === 'high') return 'text-warning-500';
  if (priority === 'medium') return 'text-brand-400';
  return 'text-graphite/50';
}

function PortalMenu({ open, onClose, anchorRef, width = 240, children }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 280 });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;
    const place = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      let left = rect.left;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const maxHeight = Math.min(280, Math.max(160, spaceBelow));
      setPos({ top: rect.bottom + 6, left, maxHeight });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, width]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{ top: pos.top, left: pos.left, width, maxHeight: pos.maxHeight }}
      className="fixed z-[90] flex flex-col overflow-hidden rounded-xl border border-hairline bg-paper shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

function ClearButton({ onClick, label }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-graphite/45 hover:bg-cloud hover:text-ink"
    >
      <X className="h-3 w-3" strokeWidth={2.25} />
    </button>
  );
}

export function BoardTaskComposer({ people = [], saving = false, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [menu, setMenu] = useState(null);
  const inputRef = useRef(null);
  const assigneeRef = useRef(null);
  const dateRef = useRef(null);
  const priorityRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canSave = title.trim().length >= 2 && !saving;
  const selectedPeople = people.filter((p) => assigneeIds.includes(String(p._id)));

  const save = () => {
    if (!canSave) return;
    onSave?.({
      title: title.trim(),
      assignees: assigneeIds,
      dueDate: dueDate ? new Date(`${dueDate}T17:00:00`).toISOString() : undefined,
      priority: priority || 'medium',
    });
  };

  return (
    <div className="relative rounded-xl border border-hairline bg-paper p-3 shadow-[0_4px_18px_rgba(15,15,20,0.06)]">
      <div className="flex items-start gap-1.5">
        <textarea
          ref={inputRef}
          rows={2}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              save();
            }
            if (e.key === 'Escape') onCancel?.();
          }}
          placeholder="Task Name..."
          className="min-h-[40px] w-0 flex-1 resize-none bg-transparent pt-0.5 text-[13px] leading-snug text-ink outline-none placeholder:text-graphite/40"
        />
        <button
          type="button"
          disabled={!canSave}
          onClick={save}
          className={cn(
            'mt-0.5 inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition',
            canSave
              ? 'bg-cloud text-ink hover:bg-surface-3'
              : 'cursor-default bg-cloud/70 text-graphite/45'
          )}
        >
          Save
          <CornerDownLeft className="h-3 w-3" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={onCancel}
          title="Don't add"
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-graphite/65 hover:bg-cloud hover:text-ink"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <div className="mt-1 space-y-0.5">
        <div className="flex items-center gap-0.5 rounded-lg pr-0.5 hover:bg-cloud/70">
          <button
            ref={assigneeRef}
            type="button"
            onClick={() => setMenu((m) => (m === 'assignee' ? null : 'assignee'))}
            className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1.5 text-left text-[13px] text-graphite"
          >
            {selectedPeople.length ? (
              <>
                <span className="flex -space-x-1.5">
                  {selectedPeople.slice(0, 3).map((p) => (
                    <UserAvatar key={p._id} user={p} size="xs" className="ring-1 ring-paper" />
                  ))}
                </span>
                <span className="min-w-0 truncate text-ink">
                  {selectedPeople.map((p) => p.name).join(', ')}
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-graphite/30 text-graphite/70">
                  <UserRound className="h-3 w-3" />
                </span>
                Add assignee
              </>
            )}
          </button>
          {selectedPeople.length ? (
            <ClearButton
              label="Remove assignees"
              onClick={() => {
                setAssigneeIds([]);
                setMenu(null);
              }}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-0.5 rounded-lg pr-0.5 hover:bg-cloud/70">
          <button
            ref={dateRef}
            type="button"
            onClick={() => setMenu((m) => (m === 'due' ? null : 'due'))}
            className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1.5 text-left text-[13px] text-graphite"
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-graphite/70" strokeWidth={1.75} />
            {dueDate ? (
              <span className="text-ink">{format(new Date(`${dueDate}T12:00:00`), 'MMM d')}</span>
            ) : (
              'Add dates'
            )}
          </button>
          {dueDate ? (
            <ClearButton
              label="Remove date"
              onClick={() => {
                setDueDate('');
                setMenu(null);
              }}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-0.5 rounded-lg pr-0.5 hover:bg-cloud/70">
          <button
            ref={priorityRef}
            type="button"
            onClick={() => setMenu((m) => (m === 'priority' ? null : 'priority'))}
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2 px-1 py-1.5 text-left text-[13px]',
              priority ? priorityFlagClass(priority) : 'text-graphite'
            )}
          >
            <Flag
              className={cn('h-4 w-4 shrink-0', priority ? 'fill-current' : 'text-graphite/70')}
              strokeWidth={1.75}
            />
            {priority ? PRIORITY_LABELS[priority] : 'Add priority'}
          </button>
          {priority ? (
            <ClearButton
              label="Remove priority"
              onClick={() => {
                setPriority('');
                setMenu(null);
              }}
            />
          ) : null}
        </div>
      </div>

      <PortalMenu
        open={menu === 'assignee'}
        onClose={() => setMenu(null)}
        anchorRef={assigneeRef}
        width={240}
      >
        <div className="border-b border-hairline px-3 py-2">
          <p className="text-xs font-semibold text-ink">Assign to</p>
        </div>
        <div className="max-h-56 overflow-y-auto p-1.5">
          {people.map((p) => {
            const id = String(p._id);
            const active = assigneeIds.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-cloud',
                  active && 'bg-cloud'
                )}
                onClick={() => {
                  setAssigneeIds((ids) => {
                    const next = toggleAssigneeId(ids, id);
                    return next ?? ids;
                  });
                }}
              >
                <UserAvatar user={p} size="sm" />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.name}</span>
                {active ? <X className="h-3.5 w-3.5 text-graphite/50" /> : null}
              </button>
            );
          })}
          {!people.length ? (
            <p className="px-2 py-3 text-center text-xs text-graphite">No people available</p>
          ) : null}
        </div>
      </PortalMenu>

      <PortalMenu open={menu === 'due'} onClose={() => setMenu(null)} anchorRef={dateRef} width={220}>
        <div className="p-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              setMenu(null);
            }}
            className="w-full rounded-md border border-hairline px-2 py-1.5 text-xs"
          />
          {dueDate ? (
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs text-graphite hover:bg-cloud"
              onClick={() => {
                setDueDate('');
                setMenu(null);
              }}
            >
              <X className="h-3 w-3" /> Remove date
            </button>
          ) : null}
        </div>
      </PortalMenu>

      <PortalMenu
        open={menu === 'priority'}
        onClose={() => setMenu(null)}
        anchorRef={priorityRef}
        width={180}
      >
        <div className="p-1.5">
          {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-cloud',
                priority === key && 'bg-cloud'
              )}
              onClick={() => {
                setPriority(key);
                setMenu(null);
              }}
            >
              <Flag className={cn('h-3.5 w-3.5 fill-current', priorityFlagClass(key))} />
              <span className="flex-1">{label}</span>
              {priority === key ? (
                <X
                  className="h-3.5 w-3.5 text-graphite/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPriority('');
                    setMenu(null);
                  }}
                />
              ) : null}
            </button>
          ))}
        </div>
      </PortalMenu>
    </div>
  );
}
