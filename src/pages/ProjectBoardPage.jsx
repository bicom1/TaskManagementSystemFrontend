import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  X,
  MessageSquare,
  GripVertical,
  CheckCircle,
  XCircle,
  LayoutGrid,
  List,
  Trash2,
  Activity,
  Search,
  Settings,
  Filter,
  ChevronDown,
  Star,
} from 'lucide-react';
import { useProject } from '@/features/projects/hooks/useProjects';
import { useUsers } from '@/features/users/hooks/useUsers';
import {
  useTaskBoard,
  useCreateTask,
  useMoveTask,
  useTask,
  useApproveTask,
  useRejectTask,
  useUpdateTask,
  useTaskActivity,
  useAdvanceTask,
  useLiveProjectBoard,
} from '@/features/tasks/hooks/useTasks';
import {
  TaskFormFields,
  buildTaskPayload,
  EMPTY_TASK_FORM,
  getProjectAssignablePeople,
  mergeAssignablePeople,
  toDatetimeLocalValue,
} from '@/features/tasks/components/TaskFormFields';
import { useTaskComments, useCreateComment } from '@/features/comments/hooks/useComments';
import {
  CommentAttachments,
  CommentText,
} from '@/features/comments/components/CommentRichContent';
import {
  TASK_STATUSES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  APPROVAL_STATUS_LABELS,
} from '@/features/tasks/api/taskApi';
import { useAuthStore } from '@/store/authStore';
import { canApproveTasks } from '@/lib/roles';
import { canManageTask } from '@/lib/taskPermissions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingScreen } from '@/components/ui/Spinner';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ClickUpTasksList } from '@/features/tasks/components/ClickUpTasksList';
import { ClickUpTaskDetail } from '@/features/tasks/components/ClickUpTaskDetail';

function getApprovalBadgeVariant(status) {
  if (status === 'pending') return 'warning';
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'destructive';
  return 'secondary';
}

function canDragTask(task, user) {
  if (!canManageTask(user, task)) return false;
  if (task.approvalStatus === 'pending') return false;
  if (task.approvalStatus === 'rejected') return false;
  return true;
}

function ApprovalActions({ task, projectId, compact = false }) {
  const approveTask = useApproveTask(projectId);
  const rejectTask = useRejectTask(projectId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (task.approvalStatus !== 'pending') return null;

  const handleReject = () => {
    rejectTask.mutate(
      { id: task._id, reason: reason || undefined },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setReason('');
        },
      }
    );
  };

  return (
    <>
      <div className={cn('flex gap-2', compact ? 'mt-2' : 'mt-3')}>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            approveTask.mutate({ id: task._id });
          }}
          disabled={approveTask.isPending}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setRejectOpen(true);
          }}
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject task">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-reject-reason">Reason (optional)</Label>
            <Textarea
              id="card-reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why…"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectTask.isPending}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function TaskCard({ task, onClick, isDragging, user, projectId, showApprovalActions }) {
  const dragEnabled = canDragTask(task, user);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task._id,
    data: { task, status: task.status },
    disabled: !dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityVariant = {
    urgent: 'destructive',
    high: 'warning',
    medium: 'secondary',
    low: 'outline',
  };

  const approvalStatus = task.approvalStatus;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border border-hairline bg-paper p-3 shadow-soft-lift transition hover:border-steel hover:shadow-md',
        isDragging && 'opacity-50 ring-2 ring-primary/30',
        !dragEnabled && 'opacity-90'
      )}
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-graphite">
          {task.key}
        </span>
        {dragEnabled ? (
          <button
            type="button"
            className="cursor-grab rounded p-0.5 text-steel opacity-0 transition group-hover:opacity-100 hover:bg-cloud hover:text-charcoal"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : (
          <span className="text-[10px] font-medium text-graphite" title="Awaiting approval">
            Locked
          </span>
        )}
      </div>
      <p className="mb-2.5 text-sm font-medium leading-snug text-ink">{task.title}</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <Badge variant={priorityVariant[task.priority] || 'secondary'}>
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </Badge>
        {approvalStatus && approvalStatus !== 'approved' && (
          <Badge variant={getApprovalBadgeVariant(approvalStatus)}>
            {APPROVAL_STATUS_LABELS[approvalStatus]}
          </Badge>
        )}
        {(task.labels || []).slice(0, 2).map((label) => (
          <Badge key={label} variant="outline">
            {label}
          </Badge>
        ))}
      </div>
      {(task.dueDate || task.assignees?.length) && (
        <div className="mb-1 space-y-1 text-[11px] text-graphite">
          {task.dueDate ? (
            <p>Due {format(new Date(task.dueDate), 'MMM d · h:mm a')}</p>
          ) : null}
          {task.assignees?.length ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 3).map((a) => (
                  <UserAvatar
                    key={String(a._id || a)}
                    user={typeof a === 'object' ? a : null}
                    name={a.name || '?'}
                    size="xs"
                    className="ring-1 ring-paper"
                  />
                ))}
              </div>
              {task.assignees.length > 3 ? (
                <span className="text-[10px]">+{task.assignees.length - 3}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      {showApprovalActions && <ApprovalActions task={task} projectId={projectId} compact />}
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  tasks,
  onTaskClick,
  activeId,
  user,
  projectId,
  showApprovalActions,
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-hairline/80 bg-cloud/80 p-3">
      <div className="mb-3 flex items-center justify-between px-0.5">
        <h3 className="text-[13px] font-semibold tracking-tight text-ink">
          {label || STATUS_LABELS[status]}
        </h3>
        <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-semibold tabular-nums text-graphite shadow-soft-lift">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[120px] flex-1 flex-col gap-2.5 overflow-y-auto">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task._id)}
              isDragging={activeId === task._id}
              user={user}
              projectId={projectId}
              showApprovalActions={showApprovalActions}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function TaskDrawer({
  taskId,
  onClose,
  projectId,
  showApprovalActions,
  projectTasks,
  assignablePeople,
}) {
  const { data: task, isLoading } = useTask(taskId);
  const { data: comments = [] } = useTaskComments(taskId);
  const { data: activity = [] } = useTaskActivity(taskId);
  const createComment = useCreateComment(taskId);
  const updateTask = useUpdateTask(projectId);
  const advanceTask = useAdvanceTask(projectId);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { content: '' } });
  const [checklistText, setChecklistText] = useState('');
  const [estimateHours, setEstimateHours] = useState('');
  const [loggedHours, setLoggedHours] = useState('');
  const [editForm, setEditForm] = useState(EMPTY_TASK_FORM);
  const [editing, setEditing] = useState(true);

  const otherTasks = useMemo(
    () => (projectTasks || []).filter((t) => t._id !== taskId),
    [projectTasks, taskId]
  );

  useEffect(() => {
    if (!task) return;
    setEstimateHours(task.estimateHours ?? '');
    setLoggedHours(task.loggedHours ?? '');
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'backlog',
      priority: task.priority || 'medium',
      assignees: (task.assignees || []).map((a) => String(a._id || a)),
      labels: task.labels || [],
      dueDateLocal: toDatetimeLocalValue(task.dueDate),
    });
  }, [task?._id, task?.updatedAt]);

  const onSubmitComment = (values) => {
    createComment.mutate(values, { onSuccess: () => reset() });
  };

  const saveTaskDetails = (e) => {
    e?.preventDefault?.();
    const payload = buildTaskPayload(editForm);
    if (!payload.title || payload.title.length < 2) return;
    updateTask.mutate({ id: taskId, payload });
  };

  const persistChecklist = (checklist) => {
    updateTask.mutate({ id: taskId, payload: { checklist } });
  };

  const addChecklistItem = () => {
    const text = checklistText.trim();
    if (!text || !task) return;
    const checklist = [...(task.checklist || []), { text, isDone: false }];
    setChecklistText('');
    persistChecklist(checklist);
  };

  const toggleChecklistItem = (index) => {
    if (!task) return;
    const checklist = (task.checklist || []).map((item, i) => {
      if (i !== index) return item;
      const isDone = !item.isDone;
      return { ...item, isDone, doneAt: isDone ? new Date().toISOString() : null };
    });
    persistChecklist(checklist);
  };

  const removeChecklistItem = (index) => {
    if (!task) return;
    const checklist = (task.checklist || []).filter((_, i) => i !== index);
    persistChecklist(checklist);
  };

  const toggleBlockedBy = (blockedId) => {
    if (!task) return;
    const current = (task.blockedBy || []).map((t) => t._id || t);
    const next = current.includes(blockedId)
      ? current.filter((id) => id !== blockedId)
      : [...current, blockedId];
    updateTask.mutate({ id: taskId, payload: { blockedBy: next } });
  };

  const saveHours = () => {
    updateTask.mutate({
      id: taskId,
      payload: {
        estimateHours: estimateHours === '' ? null : Number(estimateHours),
        loggedHours: loggedHours === '' ? null : Number(loggedHours),
      },
    });
  };

  const blockedIds = new Set((task?.blockedBy || []).map((t) => String(t._id || t)));

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <div>
            <h2 className="text-lg font-medium text-ink">Task details</h2>
            {task?.key ? <p className="text-xs text-graphite">{task.key}</p> : null}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="normal-case tracking-normal"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'View' : 'Edit'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <LoadingScreen />
          ) : task ? (
            <>
              {editing ? (
                <form onSubmit={saveTaskDetails} className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {TASK_STATUSES.map((s) => {
                      const active = s === editForm.status;
                      const passed =
                        TASK_STATUSES.indexOf(s) <= TASK_STATUSES.indexOf(editForm.status);
                      return (
                        <span
                          key={s}
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                            active
                              ? 'border-primary bg-primary text-on-ink'
                              : passed
                                ? 'border-primary-soft bg-primary-soft/50 text-primary-deep'
                                : 'border-hairline text-graphite'
                          )}
                        >
                          {STATUS_LABELS[s]}
                        </span>
                      );
                    })}
                  </div>
                  <TaskFormFields
                    idPrefix="edit-task"
                    value={editForm}
                    onChange={setEditForm}
                    people={assignablePeople}
                    compact
                  />
                  {showApprovalActions && task.approvalStatus === 'pending' && (
                    <ApprovalActions task={task} projectId={projectId} />
                  )}
                  <div className="flex flex-col gap-2">
                    {task.status !== 'done' && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full normal-case tracking-normal"
                        disabled={advanceTask.isPending}
                        onClick={() =>
                          advanceTask.mutate({ id: taskId, status: task.status })
                        }
                      >
                        {advanceTask.isPending ? 'Advancing…' : 'Next workflow step'}
                      </Button>
                    )}
                    <Button type="submit" disabled={updateTask.isPending} className="w-full">
                      {updateTask.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h3 className="text-xl font-medium text-ink">{task.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{STATUS_LABELS[task.status]}</Badge>
                    <Badge variant="secondary">{PRIORITY_LABELS[task.priority]}</Badge>
                    {task.approvalStatus && (
                      <Badge variant={getApprovalBadgeVariant(task.approvalStatus)}>
                        {APPROVAL_STATUS_LABELS[task.approvalStatus]}
                      </Badge>
                    )}
                    {(task.labels || []).map((label) => (
                      <Badge key={label} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  {task.dueDate && (
                    <p className="mt-3 text-sm text-graphite">
                      Due {format(new Date(task.dueDate), 'EEE, MMM d · h:mm a')}
                    </p>
                  )}
                  {task.assignees?.length > 0 && (
                    <p className="mt-2 text-sm text-ink">
                      Assigned to {task.assignees.map((a) => a.name).join(', ')}
                    </p>
                  )}
                  {task.description && (
                    <p className="mt-4 whitespace-pre-wrap text-sm text-charcoal">{task.description}</p>
                  )}
                  {showApprovalActions && task.approvalStatus === 'pending' && (
                    <ApprovalActions task={task} projectId={projectId} />
                  )}
                </>
              )}

              <div className="mt-6 border-t border-hairline pt-5">
                <h4 className="mb-3 font-medium text-ink">Checklist</h4>
                <ul className="mb-3 space-y-2">
                  {(task.checklist || []).map((item, index) => (
                    <li key={item._id || index} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(item.isDone)}
                        onChange={() => toggleChecklistItem(index)}
                        className="mt-1"
                      />
                      <span
                        className={cn(
                          'flex-1 text-sm text-ink',
                          item.isDone && 'text-graphite line-through'
                        )}
                      >
                        {item.text}
                      </span>
                      <button
                        type="button"
                        className="text-steel hover:text-bloom-coral"
                        onClick={() => removeChecklistItem(index)}
                        aria-label="Remove checklist item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Input
                    value={checklistText}
                    onChange={(e) => setChecklistText(e.target.value)}
                    placeholder="Add checklist item…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistItem();
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={addChecklistItem}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="mt-6 border-t border-hairline pt-5">
                <h4 className="mb-3 font-medium text-ink">Blocked by</h4>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {otherTasks.length === 0 ? (
                    <p className="text-sm text-graphite">No other tasks in this project</p>
                  ) : (
                    otherTasks.map((t) => (
                      <label key={t._id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={blockedIds.has(String(t._id))}
                          onChange={() => toggleBlockedBy(t._id)}
                        />
                        <span className="text-graphite">{t.key}</span>
                        <span className="truncate text-ink">{t.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-hairline pt-5">
                <h4 className="mb-3 font-medium text-ink">Time tracking</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="estimateHours">Estimate (h)</Label>
                    <Input
                      id="estimateHours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={estimateHours}
                      onChange={(e) => setEstimateHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loggedHours">Logged (h)</Label>
                    <Input
                      id="loggedHours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={loggedHours}
                      onChange={(e) => setLoggedHours(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  onClick={saveHours}
                  disabled={updateTask.isPending}
                >
                  Save hours
                </Button>
              </div>

              <div className="mt-6 border-t border-hairline pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-graphite" />
                  <h4 className="font-medium text-ink">Activity</h4>
                </div>
                {activity.length === 0 ? (
                  <p className="text-sm text-graphite">No activity yet</p>
                ) : (
                  <ul className="space-y-3">
                    {activity.map((entry) => (
                      <li key={entry._id} className="text-sm">
                        <p className="text-ink">
                          <span className="font-medium">{entry.actor?.name || 'Someone'}</span>{' '}
                          {String(entry.action || '').replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-graphite">
                          {entry.createdAt
                            ? formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })
                            : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-8 border-t border-hairline pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-graphite" />
                  <h4 className="font-medium text-ink">Comments ({comments.length})</h4>
                </div>

                <form onSubmit={handleSubmit(onSubmitComment)} className="mb-6 space-y-3">
                  <Textarea
                    placeholder="Add a comment…"
                    {...register('content', { required: true })}
                  />
                  <Button type="submit" size="sm" disabled={createComment.isPending}>
                    Post comment
                  </Button>
                </form>

                <ul className="space-y-4">
                  {comments.map((comment) => (
                    <li key={comment._id} className="rounded-xl bg-cloud p-3">
                      <p className="text-sm font-medium text-ink">{comment.author?.name}</p>
                      <CommentText content={comment.content} className="mt-1 !text-sm" />
                      <CommentAttachments
                        attachments={comment.attachments}
                        links={comment.links}
                      />
                      <p className="mt-2 text-xs text-graphite">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-graphite">Task not found.</p>
          )}
        </div>
      </aside>
    </>
  );
}

export default function ProjectBoardPage() {
  const { id: projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role;
  const showApprovalActions = canApproveTasks(userRole);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: usersRes } = useUsers({ limit: 200 });
  const { data: board, isLoading: boardLoading } = useTaskBoard(projectId);
  useLiveProjectBoard(projectId);
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId, { silent: true });
  const moveTask = useMoveTask(projectId);

  const catalogHref = '/projects';
  const catalogLabel = 'All Projects';
  const entityLabel = 'Project';

  useEffect(() => {
    if (!location.pathname.startsWith('/spaces/')) return;
    const qs = location.search || '';
    navigate(`/projects/${projectId}${qs}`, { replace: true });
  }, [location.pathname, location.search, projectId, navigate]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_TASK_FORM);

  const [viewMode, setViewMode] = useState(() => {
    const v = searchParams.get('view');
    if (v === 'board' || v === 'list') return v;
    return 'list';
  });

  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'board' || v === 'list') setViewMode(v);
    else if (project?.activeView === 'board' || project?.activeView === 'list') {
      setViewMode(project.activeView);
    } else if (v === 'channel') {
      setViewMode('list');
      setSearchParams({ view: 'list' }, { replace: true });
    }
  }, [searchParams, project?.activeView, setSearchParams]);

  useEffect(() => {
    const taskId = searchParams.get('task');
    if (taskId) setSelectedTaskId(taskId);
  }, [searchParams]);

  const setView = (mode) => {
    setViewMode(mode);
    setSearchParams({ view: mode }, { replace: true });
  };

  const statusLabels = useMemo(() => {
    const map = { ...STATUS_LABELS };
    for (const s of project?.statuses || []) {
      if (s?.key) map[s.key] = s.label;
    }
    return map;
  }, [project?.statuses]);

  const boardStatuses = useMemo(() => {
    const fromSpace = (project?.statuses || []).map((s) => s.key).filter(Boolean);
    const base =
      fromSpace.length > 0
        ? fromSpace.filter((k) => TASK_STATUSES.includes(k))
        : [...TASK_STATUSES];

    // Keep any status column that already has tasks (e.g. backlog) visible
    const extras = TASK_STATUSES.filter(
      (s) => !base.includes(s) && (board?.[s]?.length || 0) > 0
    );
    return base.length ? [...base, ...extras] : [...TASK_STATUSES];
  }, [project?.statuses, board]);

  // Every task on the board — not only the filtered status columns
  const allTasks = useMemo(() => {
    if (!board) return [];
    const seen = new Set();
    const list = [];
    for (const status of TASK_STATUSES) {
      for (const task of board[status] || []) {
        const id = String(task._id);
        if (seen.has(id)) continue;
        seen.add(id);
        list.push(task);
      }
    }
    return list;
  }, [board]);

  const assignablePeople = useMemo(
    () =>
      mergeAssignablePeople(
        usersRes?.data ?? [],
        getProjectAssignablePeople(project),
        user
      ),
    [usersRes, project, user]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const openCreate = () => {
    setView('list');
    setCreateForm({ ...EMPTY_TASK_FORM });
    setCreateModalOpen(true);
  };

  const createQuickTask = (fields, options = {}) => {
    const title = fields?.title?.trim();
    if (!title || title.length < 2) return;
    const status =
      fields.status ||
      (boardStatuses.includes('todo') ? 'todo' : boardStatuses[0]) ||
      'todo';
    createTask.mutate(
      {
        title,
        project: projectId,
        priority: fields.priority || 'medium',
        status,
        ...(fields.dueDate ? { dueDate: fields.dueDate } : {}),
        ...(fields.assignees?.length ? { assignees: fields.assignees } : {}),
      },
      {
        onSuccess: (task) => {
          setView('list');
          if (task?._id) setSelectedTaskId(task._id);
          options.onSuccess?.(task);
        },
      }
    );
  };

  const onCreateTask = (e) => {
    e.preventDefault();
    const payload = buildTaskPayload(createForm);
    if (!payload.title || payload.title.length < 2) return;
    createTask.mutate(
      { ...payload, project: projectId },
      {
        onSuccess: (task) => {
          setCreateModalOpen(false);
          setCreateForm({ ...EMPTY_TASK_FORM });
          setView('list');
          if (task?._id) setSelectedTaskId(task._id);
        },
      }
    );
  };

  const onInlineUpdateTask = (taskId, payload) => {
    updateTask.mutate({ id: taskId, payload });
  };

  const findContainer = (taskId) => {
    if (!board) return null;
    for (const status of TASK_STATUSES) {
      if (board[status]?.some((t) => t._id === taskId)) return status;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const task = Object.values(board ?? {})
      .flat()
      .find((t) => t._id === event.active.id);

    if (task && !canDragTask(task, user)) {
      return;
    }

    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !board) return;

    const activeId = active.id;
    const draggedTask = Object.values(board).flat().find((t) => t._id === activeId);
    if (draggedTask && !canDragTask(draggedTask, user)) return;

    const overId = over.id;

    let targetStatus = over.data?.current?.status;
    if (!targetStatus) {
      targetStatus = findContainer(overId) ?? findContainer(activeId);
    }
    if (!targetStatus) {
      if (TASK_STATUSES.includes(overId)) targetStatus = overId;
    }

    const sourceStatus = findContainer(activeId);
    if (!sourceStatus || !targetStatus) return;

    const targetColumn = board[targetStatus] ?? [];
    let position = targetColumn.length;

    if (overId !== targetStatus) {
      const overIndex = targetColumn.findIndex((t) => t._id === overId);
      if (overIndex >= 0) position = overIndex;
    }

    if (sourceStatus !== targetStatus || activeId !== overId) {
      moveTask.mutate({ id: activeId, status: targetStatus, position });
    }
  };

  if (projectLoading || boardLoading) {
    return (
      <div className="px-4 py-8">
        <LoadingScreen />
      </div>
    );
  }


  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col bg-paper">
      <div className="border-b border-hairline bg-paper px-4 pt-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Link
              to={catalogHref}
              className="shrink-0 font-medium text-graphite transition hover:text-primary"
            >
              {catalogLabel}
            </Link>
            <span className="text-steel">/</span>
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-soft-lift"
              style={{ backgroundColor: project?.color || '#1a1a1a' }}
            >
              {(project?.icon || project?.name?.[0] || 'P')
                .toString()
                .slice(0, 1)}
            </span>
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-ink">
              {project?.name ?? entityLabel}
            </h1>
            <button
              type="button"
              className="rounded-md p-1 text-graphite transition hover:bg-cloud hover:text-primary"
              title="Favorite"
            >
              <Star className="h-4 w-4" />
            </button>
            <ChevronDown className="h-4 w-4 shrink-0 text-steel" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="hidden h-8 rounded-lg px-3 normal-case tracking-normal sm:inline-flex"
              disabled
            >
              Share
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-0.5 overflow-x-auto">
          {[
            { id: 'list', label: 'List', icon: List, enabled: true },
            { id: 'board', label: 'Board', icon: LayoutGrid, enabled: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === viewMode;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={!tab.enabled}
                onClick={() => tab.enabled && setView(tab.id)}
                className={cn(
                  'relative flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors',
                  active ? 'text-ink' : 'text-graphite hover:text-ink',
                  !tab.enabled && 'cursor-default opacity-40'
                )}
              >
                <Icon
                  className={cn('h-3.5 w-3.5', active ? 'text-primary' : 'text-graphite')}
                />
                {tab.label}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 px-3 py-2.5 text-[13px] font-medium text-graphite opacity-50"
            disabled
          >
            <Plus className="h-3.5 w-3.5" />
            View
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-hairline bg-paper px-4 py-2 sm:px-5">
        <div className="flex items-center gap-1.5 text-xs text-graphite">
          <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-hairline bg-cloud/60 px-2.5 font-medium text-ink">
            Group: Status
          </span>
          <span className="inline-flex h-7 items-center gap-1 rounded-lg border border-hairline px-2.5 hover:bg-cloud">
            Subtasks
          </span>
          <span className="hidden h-7 items-center gap-1 rounded-lg border border-hairline px-2.5 hover:bg-cloud sm:inline-flex">
            Columns
          </span>
        </div>
        <div className="flex items-center gap-0.5 text-graphite">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-cloud hover:text-ink"
            title="Filter"
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-cloud hover:text-ink"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-cloud hover:text-ink"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <Button
            size="sm"
            onClick={openCreate}
            className="ml-1.5 h-8 gap-1 rounded-lg px-3 normal-case tracking-normal"
          >
            <Plus className="h-4 w-4" />
            Add Task
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <div className="flex-1 overflow-x-auto bg-cloud/60 p-4 sm:p-5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 pb-4">
              {boardStatuses.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  label={statusLabels[status]}
                  tasks={board?.[status] ?? []}
                  onTaskClick={setSelectedTaskId}
                  activeId={activeTask?._id}
                  user={user}
                  projectId={projectId}
                  showApprovalActions={showApprovalActions}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="w-72 rounded-xl border border-primary bg-paper p-3 opacity-90 shadow-lg">
                  <p className="text-xs text-graphite">{activeTask.key}</p>
                  <p className="text-sm font-medium text-ink">{activeTask.title}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-paper">
          <ClickUpTasksList
            tasks={allTasks}
            selectedId={selectedTaskId}
            onTaskClick={setSelectedTaskId}
            onCreateTask={createQuickTask}
            creating={createTask.isPending}
            people={assignablePeople}
            onUpdateTask={onInlineUpdateTask}
            groupByStatus
            statusOrder={boardStatuses}
            statusLabels={statusLabels}
            defaultCreateStatus={boardStatuses.includes('todo') ? 'todo' : boardStatuses[0]}
          />
        </div>
      )}

      {selectedTaskId && (
        <ClickUpTaskDetail
          taskId={selectedTaskId}
          projectId={projectId}
          project={project}
          catalogHref={catalogHref}
          catalogLabel={catalogLabel}
          assignablePeople={assignablePeople}
          statusLabels={statusLabels}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Old right-side TaskDrawer — replaced by ClickUpTaskDetail
      {selectedTaskId && (
        <TaskDrawer
          taskId={selectedTaskId}
          projectId={projectId}
          onClose={() => setSelectedTaskId(null)}
          showApprovalActions={showApprovalActions}
          projectTasks={allTasks}
          assignablePeople={assignablePeople}
        />
      )}
      */}

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create task"
        size="lg"
      >
        <form onSubmit={onCreateTask} className="space-y-4">
          <TaskFormFields
            idPrefix="create-task"
            value={createForm}
            onChange={setCreateForm}
            people={assignablePeople}
          />
          {!canApproveTasks(userRole) && (
            <p className="text-xs text-graphite">
              Tasks you create will be pending until a team lead approves them.
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending || !createForm.title?.trim()}>
              {createTask.isPending ? 'Creating…' : 'Create task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
