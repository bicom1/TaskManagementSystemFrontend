import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  FileText,
  Filter,
  Hash,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMyTasks } from '@/features/home/hooks/useHome';
import { useProjects } from '@/features/projects/hooks/useProjects';
import {
  useCreateTask,
  useUpdateTask,
} from '@/features/tasks/hooks/useTasks';
import { ClickUpTasksList } from '@/features/tasks/components/ClickUpTasksList';
import {
  TaskFormFields,
  buildTaskPayload,
  EMPTY_TASK_FORM,
  getProjectAssignablePeople,
  mergeAssignablePeople,
} from '@/features/tasks/components/TaskFormFields';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/api/socketClient';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ListSkeleton } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { canApproveTasks } from '@/lib/roles';

/** ClickUp-style All Tasks workspace — flat list of every task you can see */
export default function AllTasksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: tasks = [], isLoading } = useMyTasks('all');
  const { data: projectsData } = useProjects({ limit: 50 });
  const projects = projectsData?.data ?? [];
  const { data: usersRes } = useUsers({ limit: 200 });

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_TASK_FORM });
  const [createProjectId, setCreateProjectId] = useState('');

  const activeProjectId = createProjectId || projects[0]?._id || '';
  const createTask = useCreateTask(activeProjectId);
  const updateTask = useUpdateTask(activeProjectId, { silent: true });

  // Keep list fresh when any project task changes
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

  // Join first few project rooms for live updates
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

    // Instant UI on All Tasks list
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
    if (projectId) navigate(`/projects/${projectId}?view=list`);
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
          {[
            { id: 'channel', label: 'Channel', icon: Hash },
            { id: 'board', label: 'Board', icon: LayoutGrid },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'docs', label: 'Docs', icon: FileText },
            { id: 'tasks', label: 'Tasks', icon: List, active: true },
            { id: 'list', label: 'List', icon: List },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium',
                  tab.active
                    ? 'border-ink text-ink'
                    : 'cursor-default border-transparent text-graphite opacity-60'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
          <span className="flex shrink-0 items-center gap-1 border-b-2 border-transparent px-3 py-2.5 text-sm text-graphite opacity-60">
            <Plus className="h-3.5 w-3.5" />
            View
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-graphite">
          <span className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 font-medium text-ink">
            Group: None
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1">
            Subtasks
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
              Tasks you create may need team lead approval before work starts.
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
