import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Check,
  ChevronDown,
  Flag,
  Hourglass,
  Link2,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Send,
  Star,
  Tag,
  Target,
  Timer,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROLES } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';
import {
  useDeleteTask,
  useTask,
  useTaskActivity,
  useUpdateTask,
} from '@/features/tasks/hooks/useTasks';
import { useCreateComment, useTaskComments } from '@/features/comments/hooks/useComments';
import {
  CommentAttachments,
  CommentText,
} from '@/features/comments/components/CommentRichContent';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
} from '@/features/tasks/api/taskApi';

function priorityFlagClass(priority) {
  if (priority === 'urgent') return 'text-danger-500';
  if (priority === 'high') return 'text-warning-500';
  if (priority === 'medium') return 'text-brand-400';
  if (priority === 'low') return 'text-graphite/50';
  return 'text-graphite/40';
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
        'absolute z-50 mt-1 min-w-[200px] rounded-xl border border-hairline bg-paper p-2 shadow-[var(--shadow-lg)]',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function FieldRow({ icon: Icon, label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3 py-2.5 sm:grid-cols-[160px_1fr]">
      <div className="flex items-center gap-2 text-sm text-graphite">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Centered modal task detail (details + bounded activity/comments).
 * Opens when a user clicks a task name in the list.
 */
export function ClickUpTaskDetail({
  taskId,
  projectId,
  project,
  catalogHref = '/projects',
  catalogLabel = 'All Projects',
  assignablePeople = [],
  statusLabels = STATUS_LABELS,
  onClose,
}) {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  // Delete: Super Admin anywhere; Dept Head / Team Lead only in areas they manage (BE enforces)
  const canDeleteTask =
    isSuperAdmin || hasPermission(user, PERMISSIONS.TASK_DELETE);

  const { data: task, isLoading } = useTask(taskId);
  const { data: activity = [] } = useTaskActivity(taskId);
  const { data: comments = [] } = useTaskComments(taskId);
  const updateTask = useUpdateTask(projectId, { silent: true });
  const deleteTask = useDeleteTask(projectId);
  const createComment = useCreateComment(taskId);
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { content: '' } });
  const commentDraft = watch('content');

  const [menu, setMenu] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [pendingLinks, setPendingLinks] = useState([]);
  const [linkDraft, setLinkDraft] = useState('');
  const [linkTitleDraft, setLinkTitleDraft] = useState('');
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title || '');
    setDescription(task.description || '');
  }, [task?._id, task?.updatedAt]);

  const patch = (payload) => {
    if (!taskId) return;
    updateTask.mutate({ id: taskId, payload });
  };

  const saveTitle = () => {
    const next = title.trim();
    if (next.length < 2 || next === task?.title) return;
    patch({ title: next });
  };

  const saveDescription = () => {
    if ((description || '') === (task?.description || '')) return;
    patch({ description: description || '' });
  };

  const toggleAssignee = (personId) => {
    const id = String(personId);
    const current = (task?.assignees || []).map((a) => String(a._id || a));
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    patch({ assignees: next });
  };

  const addTag = () => {
    const label = tagDraft.trim();
    if (!label) return;
    const labels = [...new Set([...(task?.labels || []), label])];
    setTagDraft('');
    patch({ labels });
    setMenu(null);
  };

  const removeTag = (label) => {
    patch({ labels: (task?.labels || []).filter((l) => l !== label) });
  };

  const onComment = (values) => {
    const content = String(values.content || '').trim();
    if (!content && pendingFiles.length === 0 && pendingLinks.length === 0) return;

    createComment.mutate(
      {
        content,
        links: pendingLinks,
        files: pendingFiles.map((p) => p.file),
      },
      {
        onSuccess: () => {
          reset({ content: '' });
          setPendingFiles((prev) => {
            prev.forEach((p) => {
              if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
            });
            return [];
          });
          setPendingLinks([]);
          setLinkDraft('');
          setLinkTitleDraft('');
          setLinkPickerOpen(false);
        },
      }
    );
  };

  const addPendingFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setPendingFiles((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= 5) break;
        const previewUrl = file.type?.startsWith('image/')
          ? URL.createObjectURL(file)
          : null;
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          previewUrl,
        });
      }
      return next;
    });
  };

  const removePendingFile = (id) => {
    setPendingFiles((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const addPendingLink = () => {
    const raw = linkDraft.trim();
    if (!raw) return;
    let url = raw;
    if (!/^https?:\/\//i.test(url) && /^www\./i.test(url)) url = `https://${url}`;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      return;
    }
    setPendingLinks((prev) => {
      if (prev.some((l) => l.url === url)) return prev;
      if (prev.length >= 10) return prev;
      return [...prev, { url, title: linkTitleDraft.trim() }];
    });
    setLinkDraft('');
    setLinkTitleDraft('');
    setLinkPickerOpen(false);
  };

  const canPostComment =
    Boolean(String(commentDraft || '').trim()) ||
    pendingFiles.length > 0 ||
    pendingLinks.length > 0;

  const onDelete = () => {
    deleteTask.mutate(taskId, {
      onSuccess: () => onClose?.(),
    });
  };

  const statusOptions = useMemo(() => {
    const fromSpace = (project?.statuses || []).map((s) => s.key).filter(Boolean);
    if (fromSpace.length) return fromSpace.filter((k) => TASK_STATUSES.includes(k));
    return TASK_STATUSES;
  }, [project?.statuses]);

  const peopleById = useMemo(() => {
    const map = new Map();
    for (const p of assignablePeople || []) map.set(String(p._id), p);
    for (const a of task?.assignees || []) map.set(String(a._id || a), a);
    return map;
  }, [assignablePeople, task?.assignees]);

  const activityItems = useMemo(() => {
    const formatAction = (entry) => {
      const meta = entry.metadata || {};
      switch (entry.action) {
        case 'created':
          return { verb: 'created this task', detail: null };
        case 'assigned': {
          const ids = (meta.assignees || []).map(String);
          const names = ids
            .map((id) => peopleById.get(id)?.name)
            .filter(Boolean);
          if (names.length) return { verb: 'assigned', detail: names.join(', ') };
          return { verb: 'updated assignees', detail: null };
        }
        case 'updated': {
          const fields = (meta.fields || []).map((f) =>
            String(f)
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (c) => c.toUpperCase())
              .trim()
          );
          return {
            verb: 'updated',
            detail: fields.length ? fields.join(', ') : null,
          };
        }
        case 'status_changed': {
          const from = STATUS_LABELS[meta.from] || meta.from;
          const to = STATUS_LABELS[meta.to] || meta.to;
          return {
            verb: 'moved status',
            detail: from && to ? `${from} → ${to}` : null,
          };
        }
        default:
          return {
            verb: String(entry.action || 'updated').replace(/_/g, ' '),
            detail: null,
          };
      }
    };

    // Newest first for readable timeline
    return [...(activity || [])]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((entry) => {
        const formatted = formatAction(entry);
        return {
          id: entry._id,
          actorName: entry.actor?.name || 'Someone',
          actorId: entry.actor?._id || entry.actor,
          ...formatted,
          at: entry.createdAt,
        };
      });
  }, [activity, peopleById]);

  const commentItems = useMemo(
    () =>
      [...(comments || [])].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      ),
    [comments]
  );

  const assignees = task?.assignees || [];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/45 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        className="flex max-h-[min(900px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-hairline bg-paper shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-hairline px-4">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Link to={catalogHref} className="shrink-0 text-graphite hover:text-ink">
              {catalogLabel}
            </Link>
            <span className="text-graphite">/</span>
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: project?.color || '#292524' }}
            >
              {(project?.icon || project?.name?.[0] || 'P').toString().slice(0, 1)}
            </span>
            <span className="truncate font-medium text-ink">{project?.name || 'Project'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-graphite">
            {task?.createdAt ? (
              <span className="hidden sm:inline">
                Created {format(new Date(task.createdAt), 'MMM d')}
              </span>
            ) : null}
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-cloud',
                sidePanelOpen ? 'bg-cloud text-ink' : 'text-graphite'
              )}
              onClick={() => setSidePanelOpen((v) => !v)}
              title={sidePanelOpen ? 'Hide comments' : 'Show comments'}
              aria-pressed={sidePanelOpen}
            >
              {sidePanelOpen ? (
                <PanelRightClose className="h-3.5 w-3.5" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5" />
              )}
              <MessageSquareText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {sidePanelOpen ? 'Hide comments' : 'Comments'}
              </span>
              {(commentItems?.length ?? 0) > 0 && (
                <span className="rounded-full bg-paper px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-charcoal">
                  {commentItems.length}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                type="button"
                className="rounded-md p-1.5 hover:bg-cloud"
                onClick={() => setMoreOpen((v) => !v)}
                title="More"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {moreOpen && (
                <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg border border-hairline bg-paper shadow-[var(--shadow-soft-lift)]">
                  {canDeleteTask ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-cloud"
                      onClick={() => {
                        setMoreOpen(false);
                        setConfirmDelete(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete task
                    </button>
                  ) : (
                    <p className="px-3 py-2 text-xs text-graphite">
                      Delete is limited to Super Admin and managers in their own area
                    </p>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 hover:bg-cloud"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Left: details */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          {isLoading ? (
            <LoadingScreen />
          ) : !task ? (
            <p className="text-sm text-graphite">Task not found.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2 text-sm text-graphite">
                <span className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 font-medium text-ink">
                  Task
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
                {task.key ? (
                  <span className="font-mono text-xs text-graphite">{task.key}</span>
                ) : null}
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                className="w-full bg-transparent text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-ink outline-none placeholder:text-graphite/40"
                placeholder="Task name"
              />

              <div className="mt-4 rounded-lg border border-hairline bg-cloud/60 px-3 py-2 text-sm text-graphite">
                Ask Brain for a presentation, document or prototype
              </div>

              <div className="mt-6 divide-y divide-hairline/70">
                {/* Status */}
                <FieldRow icon={Target} label="Status">
                  <div className="relative inline-flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md border border-hairline bg-cloud px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-paper"
                      onClick={() => setMenu((m) => (m === 'status' ? null : 'status'))}
                    >
                      {statusLabels[task.status] || STATUS_LABELS[task.status] || task.status}
                      <ChevronDown className="h-3.5 w-3.5 text-graphite" />
                    </button>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-hairline text-graphite">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <Popover open={menu === 'status'} onClose={() => setMenu(null)} className="left-0 top-full">
                      {statusOptions.map((key) => (
                        <button
                          key={key}
                          type="button"
                          className={cn(
                            'flex w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase hover:bg-cloud',
                            task.status === key && 'bg-cloud'
                          )}
                          onClick={() => {
                            patch({ status: key });
                            setMenu(null);
                          }}
                        >
                          {statusLabels[key] || STATUS_LABELS[key] || key}
                        </button>
                      ))}
                    </Popover>
                  </div>
                </FieldRow>

                {/* Assignees */}
                <FieldRow icon={UserRound} label="Assignees">
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex min-h-8 items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-cloud"
                      onClick={() => setMenu((m) => (m === 'assignees' ? null : 'assignees'))}
                    >
                      {assignees.length ? (
                        <span className="flex -space-x-1.5">
                          {assignees.slice(0, 4).map((a) => (
                            <span
                              key={String(a._id || a)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper text-[10px] font-bold text-white"
                              style={{ backgroundColor: getAvatarColor(a._id || a.name) }}
                              title={a.name}
                            >
                              {getInitials(a.name || '?')}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-graphite">Empty</span>
                      )}
                      {assignees.length ? (
                        <span className="text-xs text-charcoal">
                          {assignees.map((a) => a.name).filter(Boolean).join(', ')}
                        </span>
                      ) : null}
                    </button>
                    <Popover
                      open={menu === 'assignees'}
                      onClose={() => setMenu(null)}
                      className="left-0 top-full max-h-64 overflow-y-auto"
                    >
                      <p className="mb-1 px-1 text-[11px] font-medium text-graphite">
                        Reassign to teammates
                      </p>
                      {assignablePeople.map((p) => {
                        const id = String(p._id);
                        const active = assignees.some((a) => String(a._id || a) === id);
                        return (
                          <button
                            key={id}
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-cloud',
                              active && 'bg-cloud'
                            )}
                            onClick={() => toggleAssignee(id)}
                          >
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: getAvatarColor(id) }}
                            >
                              {getInitials(p.name)}
                            </span>
                            <span className="flex-1 truncate">{p.name}</span>
                            {active ? <Check className="h-3.5 w-3.5 text-ink" /> : null}
                          </button>
                        );
                      })}
                      {!assignablePeople.length ? (
                        <p className="px-2 py-2 text-xs text-graphite">No teammates available</p>
                      ) : null}
                    </Popover>
                  </div>
                </FieldRow>

                {/* Dates */}
                <FieldRow icon={Calendar} label="Dates">
                  <div className="relative flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-md border border-dashed border-hairline px-2 py-1 text-graphite">
                      Start
                    </span>
                    <span className="text-graphite">→</span>
                    <button
                      type="button"
                      className="rounded-md border border-hairline px-2 py-1 text-ink hover:bg-cloud"
                      onClick={() => setMenu((m) => (m === 'due' ? null : 'due'))}
                    >
                      {task.dueDate
                        ? format(new Date(task.dueDate), 'MMM d, yyyy')
                        : 'Due'}
                    </button>
                    <Popover open={menu === 'due'} onClose={() => setMenu(null)} className="left-0 top-full">
                      <input
                        type="date"
                        className="w-full rounded-md border border-hairline px-2 py-1.5 text-xs"
                        defaultValue={
                          task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          patch({
                            dueDate: v ? new Date(`${v}T17:00:00`).toISOString() : null,
                          });
                          setMenu(null);
                        }}
                      />
                      {task.dueDate ? (
                        <button
                          type="button"
                          className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs text-graphite hover:bg-cloud"
                          onClick={() => {
                            patch({ dueDate: null });
                            setMenu(null);
                          }}
                        >
                          Clear due date
                        </button>
                      ) : null}
                    </Popover>
                  </div>
                </FieldRow>

                {/* Priority */}
                <FieldRow icon={Flag} label="Priority">
                  <div className="relative">
                    <button
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-sm font-medium hover:bg-cloud',
                        task.priority ? priorityFlagClass(task.priority) : 'text-graphite'
                      )}
                      onClick={() => setMenu((m) => (m === 'priority' ? null : 'priority'))}
                    >
                      <Flag className="h-3.5 w-3.5 fill-current" />
                      {task.priority ? PRIORITY_LABELS[task.priority] || task.priority : 'Empty'}
                    </button>
                    <Popover open={menu === 'priority'} onClose={() => setMenu(null)} className="left-0 top-full">
                      {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-cloud',
                            task.priority === key && 'bg-cloud'
                          )}
                          onClick={() => {
                            patch({ priority: key });
                            setMenu(null);
                          }}
                        >
                          <Flag className={cn('h-3.5 w-3.5 fill-current', priorityFlagClass(key))} />
                          {label}
                        </button>
                      ))}
                    </Popover>
                  </div>
                </FieldRow>

                {/* Time estimate */}
                <FieldRow icon={Hourglass} label="Time estimate">
                  <div className="relative">
                    <button
                      type="button"
                      className="rounded-md px-1 py-1 text-sm text-graphite hover:bg-cloud"
                      onClick={() => setMenu((m) => (m === 'estimate' ? null : 'estimate'))}
                    >
                      {task.estimateHours != null && task.estimateHours !== ''
                        ? `${task.estimateHours}h`
                        : 'Empty'}
                    </button>
                    <Popover open={menu === 'estimate'} onClose={() => setMenu(null)} className="left-0 top-full">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="Hours"
                        className="w-full rounded-md border border-hairline px-2 py-1.5 text-xs"
                        defaultValue={task.estimateHours ?? ''}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const v = e.currentTarget.value;
                            patch({ estimateHours: v === '' ? null : Number(v) });
                            setMenu(null);
                          }
                        }}
                      />
                      <p className="mt-1 px-1 text-[10px] text-graphite">Press Enter to save</p>
                    </Popover>
                  </div>
                </FieldRow>

                {/* Sprint points (UI only / stored via labels if needed — show empty interactive) */}
                <FieldRow icon={Star} label="Sprint points">
                  <span className="px-1 py-1 text-sm text-graphite">Empty</span>
                </FieldRow>

                {/* Track time */}
                <FieldRow icon={Timer} label="Track time">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-xs font-medium text-ink hover:bg-cloud"
                      onClick={() => setMenu((m) => (m === 'logged' ? null : 'logged'))}
                    >
                      <Play className="h-3 w-3" />
                      {task.loggedHours != null && task.loggedHours !== ''
                        ? `${task.loggedHours}h logged`
                        : 'Start'}
                    </button>
                    <Popover open={menu === 'logged'} onClose={() => setMenu(null)} className="left-0 top-full">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="Logged hours"
                        className="w-full rounded-md border border-hairline px-2 py-1.5 text-xs"
                        defaultValue={task.loggedHours ?? ''}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const v = e.currentTarget.value;
                            patch({ loggedHours: v === '' ? null : Number(v) });
                            setMenu(null);
                          }
                        }}
                      />
                      <p className="mt-1 px-1 text-[10px] text-graphite">Press Enter to save</p>
                    </Popover>
                  </div>
                </FieldRow>

                {/* Tags */}
                <FieldRow icon={Tag} label="Tags">
                  <div className="relative flex flex-wrap items-center gap-1.5">
                    {(task.labels || []).map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5 text-xs text-ink hover:bg-hairline"
                        onClick={() => removeTag(label)}
                        title="Remove tag"
                      >
                        {label}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                    <button
                      type="button"
                      className="rounded-md px-1 py-1 text-sm text-graphite hover:bg-cloud"
                      onClick={() => setMenu((m) => (m === 'tags' ? null : 'tags'))}
                    >
                      {(task.labels || []).length ? 'Add' : 'Empty'}
                    </button>
                    <Popover open={menu === 'tags'} onClose={() => setMenu(null)} className="left-0 top-full">
                      <input
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add tag"
                        className="w-full rounded-md border border-hairline px-2 py-1.5 text-xs"
                      />
                    </Popover>
                  </div>
                </FieldRow>
              </div>

              <div className="mt-8">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={saveDescription}
                  placeholder="Add a description…"
                  rows={8}
                  className="w-full resize-y rounded-lg border border-transparent bg-transparent px-0 py-2 text-sm text-ink outline-none placeholder:text-graphite/50 focus:border-hairline focus:px-3"
                />
              </div>
            </>
          )}
        </div>

        {/* Right: bounded activity + comments (toggleable) */}
        {sidePanelOpen && (
        <aside className="flex w-full shrink-0 flex-col border-t border-hairline bg-cloud/20 lg:w-[300px] lg:border-l lg:border-t-0">
          {/* Activity — fixed height, does not fill the whole side */}
          <div className="shrink-0 border-b border-hairline bg-paper">
            <div className="flex items-center justify-between px-3 py-2.5">
              <h3 className="text-sm font-semibold text-ink">Activity</h3>
              <span className="rounded-full bg-cloud px-2 py-0.5 text-[11px] font-medium text-graphite">
                {activityItems.length}
              </span>
            </div>
            <div className="max-h-[180px] space-y-2.5 overflow-y-auto px-3 pb-3">
              {activityItems.length === 0 ? (
                <p className="text-xs text-graphite">No activity yet</p>
              ) : (
                activityItems.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{
                        backgroundColor: getAvatarColor(item.actorId || item.actorName),
                      }}
                    >
                      {getInitials(item.actorName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug text-charcoal">
                        <span className="font-semibold text-ink">{item.actorName}</span>{' '}
                        <span>{item.verb}</span>
                        {item.detail ? (
                          <>
                            {' '}
                            <span className="font-medium text-ink">{item.detail}</span>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[10px] text-graphite">
                        {item.at
                          ? formatDistanceToNow(new Date(item.at), { addSuffix: true })
                          : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-3 py-2.5">
              <h4 className="text-sm font-semibold text-ink">Comments</h4>
              <span className="text-[11px] text-graphite">{commentItems.length}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-2">
              {commentItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-hairline bg-paper px-3 py-3 text-center text-xs text-graphite">
                  No comments yet — share notes, links, or files
                </p>
              ) : (
                commentItems.map((c) => (
                  <div key={c._id} className="rounded-xl border border-hairline bg-paper p-2.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{
                          backgroundColor: getAvatarColor(
                            c.author?._id || c.author?.name || 'u'
                          ),
                        }}
                      >
                        {getInitials(c.author?.name || '?')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">
                          {c.author?.name || 'Someone'}
                        </p>
                        <p className="text-[10px] text-graphite">
                          {c.createdAt
                            ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })
                            : ''}
                        </p>
                      </div>
                    </div>
                    <CommentText content={c.content} />
                    <CommentAttachments
                      attachments={c.attachments}
                      links={c.links}
                    />
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSubmit(onComment)}
              className="shrink-0 border-t border-hairline bg-paper p-2.5"
            >
              <div className="rounded-xl border border-hairline bg-cloud/30 focus-within:border-ink/20 focus-within:bg-paper">
                <textarea
                  placeholder="Write a comment, paste a link, or attach a file…"
                  rows={2}
                  className="w-full resize-none bg-transparent px-2.5 py-2 text-sm text-ink outline-none placeholder:text-graphite"
                  {...register('content')}
                />

                {(pendingFiles.length > 0 || pendingLinks.length > 0) && (
                  <div className="space-y-2 border-t border-hairline/70 px-2.5 py-2">
                    {pendingFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pendingFiles.map((item) => (
                          <div
                            key={item.id}
                            className="relative overflow-hidden rounded-lg border border-hairline bg-paper"
                          >
                            {item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="h-16 w-20 object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-28 items-center gap-1.5 px-2 text-[10px] text-charcoal">
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span className="line-clamp-2">{item.file.name}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removePendingFile(item.id)}
                              className="absolute right-0.5 top-0.5 rounded bg-ink/70 p-0.5 text-white hover:bg-ink"
                              aria-label="Remove file"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {pendingLinks.length > 0 && (
                      <div className="space-y-1">
                        {pendingLinks.map((link) => (
                          <div
                            key={link.url}
                            className="flex items-center gap-2 rounded-md border border-hairline bg-paper px-2 py-1.5 text-[11px]"
                          >
                            <Link2 className="h-3 w-3 shrink-0 text-graphite" />
                            <span className="min-w-0 flex-1 truncate text-ink">
                              {link.title || link.url}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingLinks((prev) => prev.filter((l) => l.url !== link.url))
                              }
                              className="text-graphite hover:text-ink"
                              aria-label="Remove link"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {linkPickerOpen && (
                  <div className="space-y-2 border-t border-hairline/70 px-2.5 py-2">
                    <input
                      value={linkDraft}
                      onChange={(e) => setLinkDraft(e.target.value)}
                      placeholder="https://…"
                      className="w-full rounded-md border border-hairline bg-paper px-2 py-1.5 text-xs outline-none focus:border-ink/30"
                    />
                    <input
                      value={linkTitleDraft}
                      onChange={(e) => setLinkTitleDraft(e.target.value)}
                      placeholder="Optional title"
                      className="w-full rounded-md border border-hairline bg-paper px-2 py-1.5 text-xs outline-none focus:border-ink/30"
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setLinkPickerOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={addPendingLink}>
                        Add link
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t border-hairline/70 px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                      className="hidden"
                      onChange={(e) => {
                        addPendingFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-md p-1.5 text-graphite hover:bg-cloud hover:text-ink"
                      title="Attach image or document"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkPickerOpen((v) => !v)}
                      className={cn(
                        'rounded-md p-1.5 hover:bg-cloud',
                        linkPickerOpen ? 'bg-cloud text-ink' : 'text-graphite hover:text-ink'
                      )}
                      title="Share a link"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createComment.isPending || !canPostComment}
                    className="gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {createComment.isPending ? 'Posting…' : 'Comment'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </aside>
        )}
        </div>
      </div>

      {confirmDelete && (
        <div
          className="absolute inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm rounded-xl border border-hairline bg-paper p-5 shadow-xl">
            <h4 className="text-base font-semibold text-ink">Delete this task?</h4>
            <p className="mt-2 text-sm text-graphite">
              This permanently removes the task. Only Super Admin can do this.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteTask.isPending}
                onClick={onDelete}
              >
                {deleteTask.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
