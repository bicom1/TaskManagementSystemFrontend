import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Star, StarOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyTasks,
  usePersonalListMutations,
  useTrackRecent,
  useHomeOverview,
  useLiveMyTasks,
} from '@/features/home/hooks/useHome';
import { useCreateTask } from '@/features/tasks/hooks/useTasks';
import { taskApi, STATUS_LABELS, TASK_STATUSES } from '@/features/tasks/api/taskApi';
import {
  TaskFormFields,
  ProjectSearchSelect,
  buildTaskPayload,
  EMPTY_TASK_FORM,
  getProjectAssignablePeople,
  mergeAssignablePeople,
} from '@/features/tasks/components/TaskFormFields';
import { TaskRow } from '@/features/home/components/HomeCards';
import { useProject, useCreateProject } from '@/features/projects/hooks/useProjects';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ListSkeleton, EmptyState } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const VIEWS = [
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'today', label: 'Today & Overdue' },
  { id: 'personal', label: 'Personal List' },
];

function StatusStepper({ status }) {
  return (
    <div className="flex flex-wrap gap-1 px-2 pt-2">
      {TASK_STATUSES.map((s) => {
        const active = s === status;
        const passed = TASK_STATUSES.indexOf(s) <= TASK_STATUSES.indexOf(status);
        return (
          <span
            key={s}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-medium',
              active
                ? 'border-primary bg-primary text-on-ink'
                : passed
                  ? 'border-primary-soft bg-primary-soft/50 text-primary-deep'
                  : 'border-hairline bg-paper text-graphite'
            )}
          >
            {STATUS_LABELS[s]}
          </span>
        );
      })}
    </div>
  );
}

export default function MyTasksPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') || 'assigned';
  const addMode = params.get('add') === '1';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: tasks = [], isLoading, isFetching } = useMyTasks(view);
  useLiveMyTasks();
  const { data: home } = useHomeOverview();
  const { data: usersRes } = useUsers({ limit: 200 });
  const { add, remove } = usePersonalListMutations();
  const trackRecent = useTrackRecent();
  const createProject = useCreateProject();

  const projects = home?.workspace?.projects ?? [];
  const teams = home?.workspace?.teams ?? [];
  const [projectId, setProjectId] = useState('');
  const [form, setForm] = useState({ ...EMPTY_TASK_FORM, status: 'todo' });
  const [advancingId, setAdvancingId] = useState(null);
  const { data: selectedProject } = useProject(projectId || undefined);
  const createTask = useCreateTask(projectId);

  const people = useMemo(
    () =>
      mergeAssignablePeople(
        usersRes?.data ?? [],
        getProjectAssignablePeople(selectedProject),
        user ? [user] : []
      ),
    [usersRes, selectedProject, user]
  );

  useEffect(() => {
    if (!projectId && projects[0]?._id) setProjectId(projects[0]._id);
  }, [projects, projectId]);

  useEffect(() => {
    if (addMode) {
      setForm({
        ...EMPTY_TASK_FORM,
        status: 'todo',
        assignees: user?._id ? [String(user._id)] : [],
      });
    }
  }, [addMode, user?._id]);

  const closeAdd = () => {
    const next = new URLSearchParams(params);
    next.delete('add');
    if (!next.get('view')) next.set('view', view);
    setParams(next);
  };

  const openTask = (task) => {
    const pid = task.project?._id || task.project;
    if (!pid) return;
    trackRecent.mutate({
      type: 'task',
      refId: task._id,
      title: task.title,
      subtitle: `in ${task.project?.name || 'Project'}`,
      projectId: pid,
    });
    navigate(`/projects/${pid}`);
  };

  const handleCreateProject = async ({ name, teamId }) => {
    if (!teamId) {
      toast.error('Pick a team for the new project');
      return null;
    }
    const keyBase = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase();
    const key = `${keyBase || 'PRJ'}${String(Date.now()).slice(-3)}`.slice(0, 10);
    try {
      const created = await createProject.mutateAsync({
        name,
        key,
        team: teamId,
        owner: user._id,
        members: [user._id],
      });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project “${name}” created`);
      return created;
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Could not create project');
      return null;
    }
  };

  const onCreate = (e) => {
    e.preventDefault();
    if (!projectId) {
      toast.error('Select or create a project first');
      return;
    }
    const payload = buildTaskPayload(form);
    if (!payload.title || payload.title.length < 2) return;
    // Ensure creator stays on Assigned to me when they forget to pick an assignee
    if (!payload.assignees?.length && user?._id) {
      payload.assignees = [String(user._id)];
    }
    createTask.mutate(
      { ...payload, project: projectId },
      {
        onSuccess: () => {
          closeAdd();
          setForm({ ...EMPTY_TASK_FORM, status: 'todo' });
          queryClient.invalidateQueries({ queryKey: ['home'] });
          setParams({ view: 'assigned' });
        },
      }
    );
  };

  const onAdvance = async (task) => {
    setAdvancingId(task._id);
    try {
      await taskApi.advanceOrUpdate(task._id, task.status);
      toast.success('Moved to next step');
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['task-board'] });
      queryClient.invalidateQueries({ queryKey: ['task', task._id] });
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Could not advance task');
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">My Tasks</h1>
          <p className="mt-1 text-sm text-graphite">
            {view === 'assigned'
              ? 'Tasks where you are an assignee — updates live when someone assigns you.'
              : view === 'today'
                ? 'Due today or overdue.'
                : 'Your starred personal list.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading ? (
            <span className="text-xs text-graphite">Updating…</span>
          ) : null}
          <Button size="sm" onClick={() => setParams({ view, add: '1' })}>
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 rounded-xl border border-hairline bg-cloud p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setParams({ view: v.id })}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              view === v.id
                ? 'bg-paper text-ink shadow-soft-lift'
                : 'text-charcoal hover:text-ink'
            )}
          >
            {v.label}
            {v.id === 'assigned' && tasks.length > 0 && view === 'assigned' ? (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {tasks.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {isLoading && tasks.length === 0 ? (
        <ListSkeleton rows={6} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title={view === 'assigned' ? 'Nothing assigned to you yet' : 'No tasks here'}
          description={
            view === 'personal'
              ? 'Add tasks to your Personal List from a project board.'
              : view === 'assigned'
                ? 'When a teammate assigns you a task (you’ll also get an email), it shows up here automatically.'
                : 'No tasks due today or overdue.'
          }
        />
      ) : (
        <div className="rounded-xl border border-hairline bg-paper">
          {view === 'assigned' && (
            <div className="border-b border-hairline bg-primary-soft/25 px-4 py-2 text-xs font-medium text-primary-deep">
              Showing {tasks.length} open task{tasks.length === 1 ? '' : 's'} assigned to you
            </div>
          )}
          {tasks.map((task) => (
            <div key={task._id} className="border-b border-hairline last:border-0">
              <StatusStepper status={task.status} />
              <div className="flex items-center gap-1 px-1 pb-2">
                <div className="min-w-0 flex-1">
                  <TaskRow task={task} onOpen={openTask} />
                </div>
                {task.status !== 'done' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="normal-case tracking-normal"
                    disabled={advancingId === task._id}
                    onClick={() => onAdvance(task)}
                    title="Move to next status"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Next
                  </Button>
                )}
                {view === 'personal' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove.mutate(task._id)}
                    title="Remove from Personal List"
                  >
                    <StarOff className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => add.mutate(task._id)}
                    title="Add to Personal List"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={addMode}
        onClose={closeAdd}
        title="Add task"
        description="Pick or create a project, then assign teammates."
        size="lg"
      >
        <form onSubmit={onCreate} className="space-y-4">
          <ProjectSearchSelect
            projects={projects}
            teams={teams}
            value={projectId}
            onChange={setProjectId}
            onCreateProject={handleCreateProject}
            creating={createProject.isPending}
          />
          <TaskFormFields
            idPrefix="my-add-task"
            value={form}
            onChange={setForm}
            people={people}
          />
          <p className="text-xs text-graphite">
            Status moves automatically as work happens. Use Next to step forward manually.
          </p>
          <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-hairline bg-paper pt-3">
            <Button type="button" variant="outline" onClick={closeAdd}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending || !form.title?.trim()}>
              {createTask.isPending ? 'Creating…' : 'Create task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
