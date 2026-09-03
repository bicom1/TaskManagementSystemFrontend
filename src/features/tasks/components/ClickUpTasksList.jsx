import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarPlus, Flag, GitBranch, Plus, UserPlus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { canManageTask } from '@/lib/taskPermissions';
import { useAuthStore } from '@/store/authStore';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from '@/features/tasks/api/taskApi';
import { StatusGroupHeader } from '@/features/tasks/components/StatusGroupHeader';

function priorityFlagClass(priority) {
  if (priority === 'urgent') return 'text-danger-500';
  if (priority === 'high') return 'text-warning-500';
  if (priority === 'medium') return 'text-brand-400';
  return 'text-graphite/40';
}

function resolvePeople(ids, people, fallback = []) {
  const map = new Map();
  for (const p of people || []) map.set(String(p._id), p);
  for (const a of fallback || []) map.set(String(a._id || a), typeof a === 'object' ? a : { _id: a });
  return (ids || []).map((id) => {
    const sid = String(id?._id || id);
    return map.get(sid) || { _id: sid, name: 'User' };
  });
}

function AssigneeStack({ assignees = [], onClick, buttonRef }) {
  if (!assignees.length) {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-graphite/35 text-graphite/60 hover:border-graphite hover:text-ink"
        title="Assign"
      >
        <UserPlus className="h-3.5 w-3.5" />
      </button>
    );
  }
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className="flex -space-x-1.5"
      title="Change assignees"
    >
      {assignees.slice(0, 3).map((a) => {
        const id = a._id || a;
        return (
          <UserAvatar
            key={String(id)}
            user={typeof a === 'object' ? a : null}
            name={a.name || '?'}
            avatarUrl={a.avatarUrl}
            seed={id}
            size="sm"
            className="border-2 border-paper"
          />
        );
      })}
      {assignees.length > 3 ? (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper bg-cloud text-[10px] font-semibold text-graphite">
          +{assignees.length - 3}
        </span>
      ) : null}
    </button>
  );
}

/** Fixed portal menu — not clipped by table overflow */
function FixedMenu({ open, onClose, anchorRef, width = 240, children }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 280 });

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return undefined;
    const place = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const panelW = width;
      const gap = 6;
      let left = rect.left;
      if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
      if (left < 8) left = 8;

      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.min(280, Math.max(140, openUp ? spaceAbove - gap : spaceBelow - gap));
      const top = openUp ? Math.max(8, rect.top - maxHeight - gap) : rect.bottom + gap;
      setPos({ top, left, maxHeight });
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
      role="listbox"
      style={{ top: pos.top, left: pos.left, width, maxHeight: pos.maxHeight }}
      className="fixed z-[90] flex flex-col overflow-hidden rounded-xl border border-hairline bg-paper shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

function Popover({ open, onClose, children, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-30 mt-1 min-w-[180px] rounded-lg border border-hairline bg-paper p-2 shadow-[var(--shadow-soft-lift)]',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function AssigneePickerList({ people, selectedIds, onToggle }) {
  const selected = new Set((selectedIds || []).map(String));
  return (
    <>
      <div className="shrink-0 border-b border-hairline px-3 py-2">
        <p className="text-xs font-semibold text-ink">Assign to</p>
        <p className="text-[11px] text-graphite">{people.length} people</p>
      </div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
        {people.map((p) => {
          const id = String(p._id);
          const active = selected.has(id);
          return (
            <button
              key={id}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-cloud',
                active && 'bg-cloud'
              )}
              onClick={() => onToggle(id, active)}
            >
              <UserAvatar user={p} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.name}</span>
              {active ? (
                <span className="text-[10px] font-semibold uppercase text-primary">On</span>
              ) : null}
            </button>
          );
        })}
        {!people.length ? (
          <p className="px-2 py-3 text-center text-xs text-graphite">No people available</p>
        ) : null}
      </div>
    </>
  );
}

const ROW_COLS =
  'grid grid-cols-[28px_minmax(0,1fr)_100px_88px_100px_56px] items-center gap-1 sm:grid-cols-[32px_minmax(0,1fr)_120px_100px_110px_64px]';

const EMPTY_DRAFT_META = {
  assigneeIds: [],
  dueDate: null,
  priority: 'medium',
};

/**
 * ClickUp-style Tasks list — assignee / due / priority update live at runtime.
 */
export function ClickUpTasksList({
  tasks,
  selectedId,
  onTaskClick,
  onCreateTask,
  creating = false,
  people = [],
  onUpdateTask,
  groupByStatus = true,
  statusOrder = TASK_STATUSES,
  statusLabels = STATUS_LABELS,
  defaultCreateStatus = 'todo',
  subtaskMode = 'collapsed',
  projectId,
  projectStatuses,
}) {
  const user = useAuthStore((s) => s.user);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftStatus, setDraftStatus] = useState(defaultCreateStatus);
  const [draftMeta, setDraftMeta] = useState(EMPTY_DRAFT_META);
  const [menu, setMenu] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [localPatches, setLocalPatches] = useState({});
  const [addingUnder, setAddingUnder] = useState(null);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const inputRef = useRef(null);
  const subtaskInputRef = useRef(null);

  const parentIdOf = (task) => {
    if (!task?.parentTask) return null;
    return String(task.parentTask._id || task.parentTask);
  };

  // Drop local patches once server data catches up
  useEffect(() => {
    setLocalPatches((prev) => {
      const ids = Object.keys(prev);
      if (!ids.length) return prev;
      const next = { ...prev };
      let changed = false;
      for (const id of ids) {
        const server = tasks.find((t) => String(t._id) === String(id));
        if (!server) continue;
        const patch = next[id];
        let matched = true;
        if (patch.priority != null && (server.priority || 'medium') !== patch.priority) matched = false;
        if (
          patch.dueDate !== undefined &&
          String(server.dueDate || '') !== String(patch.dueDate || '')
        ) {
          matched = false;
        }
        if (Array.isArray(patch.assignees)) {
          const a = (server.assignees || []).map((x) => String(x._id || x)).sort().join(',');
          const b = patch.assignees.map((x) => String(x._id || x)).sort().join(',');
          if (a !== b) matched = false;
        }
        if (matched) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tasks]);

  const displayTasks = useMemo(
    () =>
      tasks.map((t) => {
        const patch = localPatches[t._id];
        return patch ? { ...t, ...patch } : t;
      }),
    [tasks, localPatches]
  );

  const childrenByParent = useMemo(() => {
    const map = new Map();
    for (const t of displayTasks) {
      const pid = parentIdOf(t);
      if (!pid) continue;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid).push(t);
    }
    return map;
  }, [displayTasks]);

  const groups = useMemo(() => {
    const byStatus = (list) =>
      statusOrder.map((key) => ({
        key,
        label: (statusLabels[key] || STATUS_LABELS[key] || key).toUpperCase(),
        tasks: list.filter((t) => t.status === key),
      }));

    if (!groupByStatus) {
      const list =
        subtaskMode === 'separate'
          ? displayTasks
          : displayTasks.filter((t) => !parentIdOf(t));
      return [{ key: 'all', label: 'Tasks', tasks: list }];
    }

    if (subtaskMode === 'separate') {
      return byStatus(displayTasks);
    }

    return byStatus(displayTasks.filter((t) => !parentIdOf(t)));
  }, [displayTasks, groupByStatus, statusOrder, statusLabels, subtaskMode]);

  const applyUpdate = (taskId, apiPayload, displayPatch, taskRef) => {
    const task =
      taskRef || displayTasks.find((t) => String(t._id) === String(taskId));
    if (!canManageTask(user, task)) return;
    setLocalPatches((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...displayPatch },
    }));
    onUpdateTask?.(taskId, apiPayload);
  };

  const submitDraft = (status = draftStatus) => {
    const title = draftTitle.trim();
    if (title.length < 2 || creating) return;
    onCreateTask?.(
      {
        title,
        status,
        priority: draftMeta.priority || 'medium',
        dueDate: draftMeta.dueDate || undefined,
        assignees: draftMeta.assigneeIds?.length ? draftMeta.assigneeIds : undefined,
      },
      {
        onSuccess: () => {
          setDraftTitle('');
          setDraftMeta(EMPTY_DRAFT_META);
          inputRef.current?.focus();
        },
      }
    );
  };

  const openMenu = (e, type, taskId) => {
    e.stopPropagation();
    const anchorEl = e.currentTarget;
    setMenu((m) =>
      m?.type === type && m?.taskId === taskId ? null : { type, taskId, anchorEl }
    );
  };

  const draftAssignees = resolvePeople(draftMeta.assigneeIds, people);
  const assigneeMenuOpen = menu?.type === 'assignee';
  const draftAssigneeMenuOpen = menu?.type === 'draft-assignee';
  const menuAnchorRef = useMemo(
    () => ({ current: menu?.anchorEl || null }),
    [menu?.anchorEl]
  );

  const submitSubtask = (parentTask) => {
    const title = subtaskDraft.trim();
    if (title.length < 2 || creating || !parentTask?._id) return;
    onCreateTask?.(
      {
        title,
        status: parentTask.status || defaultCreateStatus,
        parentTask: parentTask._id,
      },
      {
        onSuccess: () => {
          setSubtaskDraft('');
          setAddingUnder(parentTask._id);
          subtaskInputRef.current?.focus();
        },
      }
    );
  };

  const renderTaskRow = (task, { depth = 0 } = {}) => {
    const selected = selectedId === task._id;
    const canEdit = canManageTask(user, task);
    const childCount = (childrenByParent.get(String(task._id)) || []).length || task.subtaskCount || 0;
    const hasSubtasks = childCount > 0;
    const isSubtask = Boolean(parentIdOf(task));
    const menuOpen = menu?.taskId === task._id;
    const assignees = resolvePeople(
      (task.assignees || []).map((a) => a._id || a),
      people,
      task.assignees
    );

    return (
      <div
        key={task._id}
        role="button"
        tabIndex={0}
        onClick={() => onTaskClick?.(task._id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onTaskClick?.(task._id);
        }}
        className={cn(
          ROW_COLS,
          'group relative px-3 py-1.5 text-sm transition-colors sm:px-4 sm:py-2',
          'hover:bg-cloud/70',
          selected && 'bg-[#edf4ff]'
        )}
      >
        <div className="flex justify-center">
          <span
            className={cn(
              'inline-flex h-[15px] w-[15px] rounded-full border',
              selected
                ? 'border-[#3b82f6] bg-[#3b82f6]'
                : 'border-dashed border-graphite/40 bg-transparent'
            )}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth ? depth * 18 : 0 }}>
            {isSubtask ? (
              <GitBranch className="h-3 w-3 shrink-0 text-graphite/70" />
            ) : null}
            <span className="truncate text-[13px] text-ink group-hover:underline">
              {task.title}
            </span>
            {hasSubtasks && !isSubtask ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-graphite">
                <GitBranch className="h-3 w-3" />
                {childCount}
              </span>
            ) : null}
          </div>
        </div>

        <div className={cn('relative z-10', !canEdit && 'pointer-events-none opacity-60')} onClick={(e) => e.stopPropagation()}>
          <AssigneeStack
            assignees={assignees}
            onClick={(e) => canEdit && openMenu(e, 'assignee', task._id)}
          />
        </div>

        <div className={cn('relative', !canEdit && 'pointer-events-none opacity-60')}>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-graphite/55 hover:text-ink"
            onClick={(e) => canEdit && openMenu(e, 'due', task._id)}
            title="Set due date"
            disabled={!canEdit}
          >
            {task.dueDate ? (
              <span className="text-xs font-medium text-charcoal">
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            ) : (
              <CalendarPlus className="h-4 w-4" />
            )}
          </button>
          <Popover
            open={menuOpen && menu?.type === 'due'}
            onClose={() => setMenu(null)}
            className="left-0 top-full"
          >
            <input
              type="date"
              className="w-full rounded-md border border-hairline px-2 py-1.5 text-xs"
              defaultValue={task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const v = e.target.value;
                const dueDate = v ? new Date(`${v}T17:00:00`).toISOString() : null;
                applyUpdate(task._id, { dueDate }, { dueDate });
                setMenu(null);
              }}
            />
            {task.dueDate ? (
              <button
                type="button"
                className="mt-1 flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs text-graphite hover:bg-cloud"
                onClick={() => {
                  applyUpdate(task._id, { dueDate: null }, { dueDate: null });
                  setMenu(null);
                }}
              >
                <X className="h-3 w-3" /> Clear due date
              </button>
            ) : null}
          </Popover>
        </div>

        <div className={cn('relative', !canEdit && 'pointer-events-none opacity-60')}>
          <button
            type="button"
            className={cn(
              'inline-flex max-w-full items-center gap-1 truncate text-xs font-medium',
              priorityFlagClass(task.priority || 'medium')
            )}
            onClick={(e) => canEdit && openMenu(e, 'priority', task._id)}
            title={`Priority: ${PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.medium}`}
            disabled={!canEdit}
          >
            <Flag className="h-3.5 w-3.5 shrink-0 fill-current" />
            <span className="truncate">
              {PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.medium}
            </span>
          </button>
          <Popover
            open={menuOpen && menu?.type === 'priority'}
            onClose={() => setMenu(null)}
            className="left-0 top-full"
          >
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-cloud',
                  (task.priority || 'medium') === key && 'bg-cloud'
                )}
                onClick={() => {
                  applyUpdate(task._id, { priority: key }, { priority: key });
                  setMenu(null);
                }}
              >
                <Flag className={cn('h-3.5 w-3.5 fill-current', priorityFlagClass(key))} />
                {label}
              </button>
            ))}
          </Popover>
        </div>

        <div className="text-right">
          {!isSubtask && canEdit ? (
            <button
              type="button"
              className="invisible text-[11px] font-medium text-graphite hover:text-ink group-hover:visible"
              onClick={(e) => {
                e.stopPropagation();
                setAddingUnder(String(task._id));
                setSubtaskDraft('');
                requestAnimationFrame(() => subtaskInputRef.current?.focus());
              }}
            >
              + Subtask
            </button>
          ) : (
            <span className="invisible text-xs text-graphite group-hover:visible">···</span>
          )}
        </div>
      </div>
    );
  };

  const renderAddSubtaskRow = (parent) => {
    const active = String(addingUnder) === String(parent._id);
    return (
      <div
        key={`add-subtask-${parent._id}`}
        className={cn(ROW_COLS, 'px-3 py-1 sm:px-4')}
        onClick={(e) => e.stopPropagation()}
      >
        <div />
        <div className="flex min-w-0 items-center gap-2 pl-[18px]">
          <GitBranch className="h-3 w-3 shrink-0 text-graphite/50" />
          <input
            ref={active ? subtaskInputRef : undefined}
            value={active ? subtaskDraft : ''}
            onFocus={() => setAddingUnder(String(parent._id))}
            onChange={(e) => {
              setAddingUnder(String(parent._id));
              setSubtaskDraft(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitSubtask(parent);
              }
              if (e.key === 'Escape') {
                setAddingUnder(null);
                setSubtaskDraft('');
              }
            }}
            placeholder="Add subtask"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-graphite/50"
            disabled={creating}
          />
        </div>
        <div />
        <div />
        <div />
        <div />
      </div>
    );
  };

  const renderTaskBlock = (task) => {
    const children = childrenByParent.get(String(task._id)) || [];
    const isParent = !parentIdOf(task);
    const showChildren = subtaskMode === 'expanded' && isParent;
    const showAdd =
      isParent && (showChildren || String(addingUnder) === String(task._id));
    return (
      <div key={task._id}>
        {renderTaskRow(task, { depth: isParent ? 0 : 1 })}
        {showChildren && children.map((child) => renderTaskRow(child, { depth: 1 }))}
        {showAdd ? renderAddSubtaskRow(task) : null}
      </div>
    );
  };

  const renderInlineCreate = (status) => {
    const draftMenuOpen = menu?.taskId === `draft:${status}`;
    return (
      <div className={cn(ROW_COLS, 'px-3 py-1.5 sm:px-4 sm:py-2')}>
        <div className="flex justify-center">
          <span className="inline-flex h-[15px] w-[15px] rounded-full border border-dashed border-graphite/35" />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Plus className="h-3.5 w-3.5 shrink-0 text-graphite/50" />
          <input
            ref={status === draftStatus ? inputRef : undefined}
            value={draftStatus === status ? draftTitle : ''}
            onFocus={() => setDraftStatus(status)}
            onChange={(e) => {
              setDraftStatus(status);
              setDraftTitle(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitDraft(status);
              }
            }}
            placeholder="Task name"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-graphite/50"
            disabled={creating}
          />
        </div>

        <div className="relative z-10">
          <AssigneeStack
            assignees={draftStatus === status ? draftAssignees : []}
            onClick={(e) => {
              setDraftStatus(status);
              openMenu(e, 'draft-assignee', `draft:${status}`);
            }}
          />
        </div>

        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-graphite/55 hover:text-ink"
            onClick={(e) => {
              setDraftStatus(status);
              openMenu(e, 'draft-due', `draft:${status}`);
            }}
            title="Set due date"
          >
            {draftStatus === status && draftMeta.dueDate ? (
              <span className="text-xs font-medium text-charcoal">
                {format(new Date(draftMeta.dueDate), 'MMM d')}
              </span>
            ) : (
              <CalendarPlus className="h-4 w-4" />
            )}
          </button>
          <Popover
            open={draftMenuOpen && menu?.type === 'draft-due'}
            onClose={() => setMenu(null)}
            className="left-0 top-full"
          >
            <input
              type="date"
              className="w-full rounded-md border border-hairline px-2 py-1.5 text-xs"
              value={
                draftMeta.dueDate ? format(new Date(draftMeta.dueDate), 'yyyy-MM-dd') : ''
              }
              onChange={(e) => {
                const v = e.target.value;
                setDraftMeta((m) => ({
                  ...m,
                  dueDate: v ? new Date(`${v}T17:00:00`).toISOString() : null,
                }));
                setMenu(null);
              }}
            />
          </Popover>
        </div>

        <div className="relative">
          <button
            type="button"
            className={cn(
              'inline-flex max-w-full items-center gap-1 truncate text-xs font-medium',
              priorityFlagClass(draftStatus === status ? draftMeta.priority : 'medium')
            )}
            onClick={(e) => {
              setDraftStatus(status);
              openMenu(e, 'draft-priority', `draft:${status}`);
            }}
            title="Set priority"
          >
            <Flag className="h-3.5 w-3.5 shrink-0 fill-current" />
            <span className="truncate">
              {PRIORITY_LABELS[draftStatus === status ? draftMeta.priority : 'medium']}
            </span>
          </button>
          <Popover
            open={draftMenuOpen && menu?.type === 'draft-priority'}
            onClose={() => setMenu(null)}
            className="left-0 top-full"
          >
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-cloud',
                  draftMeta.priority === key && 'bg-cloud'
                )}
                onClick={() => {
                  setDraftMeta((m) => ({ ...m, priority: key }));
                  setMenu(null);
                }}
              >
                <Flag className={cn('h-3.5 w-3.5 fill-current', priorityFlagClass(key))} />
                {label}
              </button>
            ))}
          </Popover>
        </div>

        <div />
      </div>
    );
  };

  return (
    <div className="bg-paper">
      <div
        className={cn(
          ROW_COLS,
          'sticky top-0 z-10 border-b border-hairline bg-cloud/50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-graphite backdrop-blur-sm sm:px-4'
        )}
      >
        <div />
        <div>Name</div>
        <div>Assignee</div>
        <div>Due date</div>
        <div>Priority</div>
        <div className="text-right normal-case tracking-normal text-graphite">+ Add</div>
      </div>

      {groupByStatus ? (
        <div className="space-y-1.5 py-2">
          {groups.map((group) => {
            const isCollapsed = Boolean(collapsed[group.key]);
            const statusColor = (projectStatuses || []).find((s) => s.key === group.key)?.color;
            return (
              <div key={group.key} className="px-1 sm:px-2">
                <StatusGroupHeader
                  status={group.key}
                  label={group.label}
                  color={statusColor}
                  count={group.tasks.length}
                  collapsed={isCollapsed}
                  onToggleCollapse={() =>
                    setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))
                  }
                  onAdd={() => {
                    setCollapsed((c) => ({ ...c, [group.key]: false }));
                    setDraftStatus(group.key);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  projectId={projectId}
                  projectStatuses={projectStatuses}
                  variant="list"
                  className="mb-1 px-1 py-1"
                />
                {!isCollapsed && (
                  <div className="overflow-hidden rounded-xl border border-hairline/70 bg-paper">
                    {group.tasks.map((task) =>
                      subtaskMode === 'separate' ? renderTaskRow(task, { depth: parentIdOf(task) ? 1 : 0 }) : renderTaskBlock(task)
                    )}
                    {renderInlineCreate(group.key)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-hairline">
          {displayTasks.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-graphite">
              No tasks yet — set assignee, due date, and priority, then press Enter.
            </p>
          ) : null}
          {displayTasks
            .filter((t) => (subtaskMode === 'separate' ? true : !parentIdOf(t)))
            .map((task) =>
              subtaskMode === 'separate'
                ? renderTaskRow(task, { depth: parentIdOf(task) ? 1 : 0 })
                : renderTaskBlock(task)
            )}
          {renderInlineCreate(defaultCreateStatus)}
        </div>
      )}

      <FixedMenu
        open={assigneeMenuOpen}
        onClose={() => setMenu(null)}
        anchorRef={menuAnchorRef}
        width={260}
      >
        <AssigneePickerList
          people={people}
          selectedIds={
            displayTasks
              .find((t) => String(t._id) === String(menu?.taskId))
              ?.assignees?.map((a) => a._id || a) || []
          }
          onToggle={(id, active) => {
            const task = displayTasks.find((t) => String(t._id) === String(menu?.taskId));
            if (!task) return;
            const current = (task.assignees || []).map((a) => String(a._id || a));
            const nextIds = active ? current.filter((x) => x !== id) : [...current, id];
            const nextPeople = resolvePeople(nextIds, people, task.assignees);
            applyUpdate(task._id, { assignees: nextIds }, { assignees: nextPeople });
          }}
        />
      </FixedMenu>

      <FixedMenu
        open={draftAssigneeMenuOpen}
        onClose={() => setMenu(null)}
        anchorRef={menuAnchorRef}
        width={260}
      >
        <AssigneePickerList
          people={people}
          selectedIds={draftMeta.assigneeIds}
          onToggle={(id, active) => {
            setDraftMeta((m) => ({
              ...m,
              assigneeIds: active
                ? m.assigneeIds.filter((x) => x !== id)
                : [...m.assigneeIds, id],
            }));
          }}
        />
      </FixedMenu>
    </div>
  );
}
