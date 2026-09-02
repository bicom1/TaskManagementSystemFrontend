import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Filter, LayoutGrid, List, Plus, Search, Settings } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMyTasks } from '@/features/home/hooks/useHome';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useCreateTask, useUpdateTask } from '@/features/tasks/hooks/useTasks';
import { ClickUpTasksList } from '@/features/tasks/components/ClickUpTasksList';
import {
  TaskFormFields,
  buildTaskPayload,
  EMPTY_TASK_FORM,
  getProjectAssignablePeople,
  mergeAssignablePeople,
} from '@/features/tasks/components/TaskFormFields';
import { STATUS_LABELS, TASK_STATUSES } from '@/features/tasks/api/taskApi';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/api/socketClient';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ListSkeleton } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { canApproveTasks } from '@/lib/roles';
import { projectPath } from '@/features/spaces/spaceKinds';

const VIEW_TABS = [
  { id: 'list', label: 'List', icon: List },
  { id: 'board', label: 'Board', icon: LayoutGrid },
];

function AllTasksBoard({ tasks, onTaskClick }) {
  const columns = useMemo(() => {
    const map = Object.fromEntries(TASK_STATUSES.map((s) => [s, []]));
    for (const task of tasks) {
      const status = TASK_STATUSES.includes(task.status) ? task.status : 'todo';
      map[status].push(task);
    }
    return map;
  }, [tasks]);

  return (
    <div className="flex h-full gap-3 overflow-x-auto p-4">
      {TASK_STATUSES.map((status) => (
        <div
          key={status}
          className="flex w-64 shrink-0 flex-col rounded-xl border border-hairline bg-cloud/40"
        >
          <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-graphite">
              {STATUS_LABELS[status] || status}
            </span>
            <span className="text-[11px] font-semibold tabular-nums text-graphite">
              {columns[status].length}
            </span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            {columns[status].map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => onTaskClick(task._id)}
                className="w-full rounded-lg border border-hairline bg-paper px-3 py-2.5 text-left shadow-sm transition hover:border-primary/30"
              >
                <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                <p className="mt-1 truncate text-[11px] text-graphite">
                  {task.project?.name || 'Project'}
                </p>
              </button>
            ))}
            {columns[status].length === 0 && (
              <p className="px-1 py-4 text-center text-[11px] text-graphite">No tasks</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** ClickUp-style All Tasks — Channel / List / Board only */
export default function AllTasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: tasks = [], isLoading } = useMyTasks('all');
  const { data: projectsData } = useProjects({ limit: 50 });
  const projects = projectsData?.data ?? [];
  const { data: usersRes } = useUsers({ limit: 200 });

  const viewMode = ['list', 'board'].includes(searchParams.get('view'))
    ? searchParams.get('view')
    : 'list';

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_TASK_FORM });
  const [createProjectId, setCreateProjectId] = useState('');

  const activeProjectId = createProjectId || projects[0]?._id || '';
  const createTask = useCreateTask(activeProjectId);
  const updateTask = useUpdateTask(activeProjectId, { silent: true });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['home', 'my-tasks', 'all'] });
    };
    socket.on('projects:counts', refresh);
    socket.on('task:changed', refresh);
    socket.on('task:created', refresh);
    socket.on('task:updated', refresh);
    return () => {
      socket.off('projects:counts', refresh);
      socket.off('task:changed', refresh);
      socket.off('task:created', refresh);
      socket.off('task:updated', refresh);
    };
  }, [queryClient]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const ids = projects.slice(0, 20).map((p) => p._id);
    ids.forEach((id) => socket.emit('project:join', id));
    return () => {
      ids.forEach((id) => socket.emit('project:leave', id));
    };
  }, [projects]);

  const people = useMemo(() => {
    const fromProjects = [];
    for (const p of projects) {
      fromProjects.push(...(getProjectAssignablePeople(p) || []));
    }
    return mergeAssignablePeople(usersRes?.data ?? [], fromProjects, user);
  }, [projects, usersRes, user]);

  const workspaceName =
    projects[0]?.team?.name || user?.department?.name || "Team's Workspace";

  const setView = (mode) => {
    setSearchParams({ view: mode }, { replace: true });
  };

  const openCreate = () => {
    setCreateForm({ ...EMPTY_TASK_FORM });
    setCreateProjectId(projects[0]?._id || '');
    setCreateOpen(true);
  };

  const createQuickTask = (fields, options = {}) => {
    const title = fields?.title?.trim();
    const projectId = activeProjectId || projects[0]?._id;
    if (!title || title.length < 2) return;
    if (!projectId) {
      setCreateOpen(true);
      setCreateForm({ ...EMPTY_TASK_FORM, title });
      return;
    }
    createTask.mutate(
      {
        title,
        project: projectId,
        priority: fields.priority || 'medium',
        status: fields.status || 'todo',
        ...(fields.dueDate ? { dueDate: fields.dueDate } : {}),
        ...(fields.assignees?.length ? { assignees: fields.assignees } : {}),
      },
      {
        onSuccess: (task) => {
          queryClient.invalidateQueries({ queryKey: ['home', 'my-tasks', 'all'] });
          if (task?._id) setSelectedTaskId(task._id);
          options.onSuccess?.(task);
        },
      }
    );
  };

  const onCreateSubmit = (e) => {
    e.preventDefault();
    const payload = buildTaskPayload(createForm);
    if (!payload.title || payload.title.length < 2) return;
    const projectId = createProjectId || projects[0]?._id;
    if (!projectId) return;
    createTask.mutate(
      { ...payload, project: projectId },
      {
        onSuccess: (task) => {
          setCreateOpen(false);
          setCreateForm({ ...EMPTY_TASK_FORM });
          queryClient.invalidateQueries({ queryKey: ['home', 'my-tasks', 'all'] });
          if (task?._id) setSelectedTaskId(task._id);
        },
      }
    );
  };

  const onInlineUpdate = (taskId, payload) => {
    const task = tasks.find((t) => t._id === taskId);
    const projectId = task?.project?._id || task?.project || activeProjectId;
    if (!projectId) return;

    queryClient.setQueryData(['home', 'my-tasks', 'all'], (prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((t) => {
        if (String(t._id) !== String(taskId)) return t;
        const next = { ...t, ...payload };
        if (Array.isArray(payload.assignees)) {
          const map = new Map(people.map((p) => [String(p._id), p]));
          next.assignees = payload.assignees.map(
            (id) => map.get(String(id)) || { _id: id, name: 'User' }
          );
        }
        return next;
      });
    });

    updateTask.mutate(
      { id: taskId, payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['home', 'my-tasks', 'all'] });
        },
      }
    );
  };

  const onTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t._id === taskId);
    const projectId = task?.project?._id || task?.project;
    if (projectId) navigate(`${projectPath(projectId)}?view=${viewMode}&task=${taskId}`);
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="px-4 py-8">
        <ListSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col bg-paper">
      <div className="border-b border-hairline bg-paper px-4 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-base font-semibold text-ink">{workspaceName}</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Task
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-1 overflow-x-auto">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === viewMode;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium',
                  active
                    ? 'border-ink text-ink'
                    : 'border-transparent text-graphite hover:text-ink'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-graphite">
          <span className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 font-medium text-ink">
            Group: {viewMode === 'board' ? 'Status' : 'None'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1">
            {tasks.length} tasks
          </span>
        </div>
        <div className="flex items-center gap-1 text-graphite">
          <button type="button" className="rounded p-1.5 hover:bg-cloud" title="Filter">
            <Filter className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-cloud" title="Search">
            <Search className="h-4 w-4" />
          </button>
          <button type="button" className="rounded p-1.5 hover:bg-cloud" title="Settings">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === 'board' ? (
          <AllTasksBoard tasks={tasks} onTaskClick={onTaskClick} />
        ) : (
          <ClickUpTasksList
            tasks={tasks}
            selectedId={selectedTaskId}
            onTaskClick={onTaskClick}
            onCreateTask={createQuickTask}
            creating={createTask.isPending}
            people={people}
            onUpdateTask={onInlineUpdate}
            groupByStatus={false}
            defaultCreateStatus="todo"
          />
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add task" size="lg">
        <form onSubmit={onCreateSubmit} className="space-y-4">
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink" htmlFor="all-tasks-project">
                Project
              </label>
              <select
                id="all-tasks-project"
                className="flex h-10 w-full rounded-md border border-hairline bg-paper px-3 text-sm"
                value={createProjectId || projects[0]?._id || ''}
                onChange={(e) => setCreateProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <TaskFormFields
            idPrefix="all-tasks-create"
            value={createForm}
            onChange={setCreateForm}
            people={people}
          />
          {!canApproveTasks(user?.role) && (
            <p className="text-xs text-graphite">
              Super Admin is notified when you create or reassign tasks.
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTask.isPending || !createForm.title?.trim() || !projects.length}
            >
              {createTask.isPending ? 'Creating…' : 'Create task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
