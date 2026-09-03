import { useMemo, useState } from 'react';
import { Calendar, GitBranch, Plus, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { STATUS_LABELS } from '@/features/tasks/api/taskApi';
import { useCreateTask, useTaskSubtasks } from '@/features/tasks/hooks/useTasks';
import { fromDatetimeLocalValue } from './TaskFormFields';

const EMPTY_SUBTASK_FORM = {
  title: '',
  description: '',
  assignees: [],
  dueDateLocal: '',
};

export function SubtasksPanel({
  parentTask,
  projectId,
  people = [],
  statusLabels = STATUS_LABELS,
  canEdit = true,
  onOpenTask,
}) {
  const parentId = parentTask?._id;
  const { data: subtasks = [], isLoading } = useTaskSubtasks(parentId);
  const createTask = useCreateTask(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SUBTASK_FORM);

  const selected = useMemo(
    () => new Set((form.assignees || []).map(String)),
    [form.assignees]
  );

  const toggleAssignee = (id) => {
    const sid = String(id);
    const next = selected.has(sid)
      ? form.assignees.filter((x) => String(x) !== sid)
      : [...form.assignees, sid];
    setForm((f) => ({ ...f, assignees: next }));
  };

  const submit = (e) => {
    e?.preventDefault?.();
    const title = form.title.trim();
    if (title.length < 2 || !parentId) return;
    createTask.mutate(
      {
        title,
        description: form.description.trim(),
        project: projectId,
        parentTask: parentId,
        status: parentTask.status || 'todo',
        assignees: form.assignees,
        dueDate: fromDatetimeLocalValue(form.dueDateLocal),
      },
      {
        onSuccess: () => {
          setForm(EMPTY_SUBTASK_FORM);
          setFormOpen(false);
        },
      }
    );
  };

  if (!parentId) return null;

  return (
    <section className="mt-8 border-t border-hairline pt-6">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite">
            Subtasks of
          </p>
          <h3 className="truncate text-base font-semibold text-ink">{parentTask.title}</h3>
        </div>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1"
            onClick={() => setFormOpen((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add subtask
          </Button>
        )}
      </div>

      {formOpen && canEdit && (
        <form
          onSubmit={submit}
          className="mb-4 space-y-3 rounded-xl border border-hairline bg-cloud/40 p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="subtask-title">Subtask name</Label>
            <Input
              id="subtask-title"
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Name this subtask"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subtask-desc">Description</Label>
            <Textarea
              id="subtask-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Details, notes, links…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Assignees</Label>
              <div className="max-h-28 overflow-y-auto rounded-lg border border-hairline bg-paper p-1.5">
                {people.map((p) => {
                  const id = String(p._id);
                  const on = selected.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleAssignee(id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-cloud',
                        on && 'bg-cloud'
                      )}
                    >
                      <UserAvatar user={p} size="xs" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
                {!people.length ? (
                  <p className="px-2 py-2 text-xs text-graphite">No people to assign</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtask-due">Due date</Label>
              <Input
                id="subtask-due"
                type="datetime-local"
                value={form.dueDateLocal}
                onChange={(e) => setForm((f) => ({ ...f, dueDateLocal: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.title.trim().length < 2 || createTask.isPending}>
              {createTask.isPending ? 'Creating…' : 'Create subtask'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-graphite">Loading subtasks…</p>
      ) : subtasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-sm text-graphite">
          No subtasks yet. Add one with a name, description, assignees, and due date.
        </p>
      ) : (
        <ul className="space-y-2">
          {subtasks.map((item) => (
            <li key={item._id}>
              <button
                type="button"
                onClick={() => onOpenTask?.(item._id)}
                className="flex w-full items-start gap-3 rounded-xl border border-hairline bg-paper px-3 py-2.5 text-left transition hover:border-primary/25 hover:bg-cloud/50"
              >
                <GitBranch className="mt-1 h-4 w-4 shrink-0 text-graphite" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-graphite">{item.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-graphite">
                    <span className="rounded-md bg-cloud px-1.5 py-0.5 font-medium uppercase text-ink">
                      {statusLabels[item.status] || STATUS_LABELS[item.status] || item.status}
                    </span>
                    {(item.assignees || []).length ? (
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="h-3 w-3" />
                        <span className="flex -space-x-1">
                          {item.assignees.slice(0, 3).map((a) => (
                            <span
                              key={String(a._id || a)}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                              style={{ backgroundColor: getAvatarColor(a._id || a.name) }}
                            >
                              {getInitials(a.name || '?')}
                            </span>
                          ))}
                        </span>
                      </span>
                    ) : null}
                    {item.dueDate ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.dueDate), 'MMM d')}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
