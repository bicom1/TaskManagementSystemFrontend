import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/UserAvatar';
import { HomePanel } from '@/features/home/components/HomeCards';
import { getRoleLabel } from '@/lib/roles';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/features/tasks/api/taskApi';
import { PROJECT_STATUS_LABELS } from '@/features/projects/api/projectApi';
import { formatTaskTitle } from '@/features/tasks/taskTitle';
import { projectPath } from '@/features/spaces/spaceKinds';

function EmptyLine({ children }) {
  return <p className="px-3 py-10 text-center text-[12.5px] leading-relaxed text-graphite">{children}</p>;
}

function ListRow({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left transition hover:bg-cloud"
    >
      {children}
    </button>
  );
}

export function WorkspaceDirectory({ workspace }) {
  const navigate = useNavigate();
  const members = workspace?.members || [];
  const projects = workspace?.projects || [];
  const tasks = workspace?.tasks || [];

  return (
    <div className="mb-6 grid items-stretch gap-4 lg:grid-cols-3">
      <HomePanel
        className="min-h-[320px]"
        title="Members"
        count={workspace?.totals?.people ?? members.length}
      >
        {members.length === 0 ? (
          <EmptyLine>No members yet.</EmptyLine>
        ) : (
          members.slice(0, 12).map((person) => (
            <ListRow key={person.id} onClick={() => navigate('/teams/people')}>
              <div className="flex min-w-0 items-center gap-2.5">
                <UserAvatar user={person} size="sm" className="h-7 w-7 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{person.name}</p>
                  <p className="truncate text-xs text-graphite">
                    {person.jobTitle || getRoleLabel(person.role)}
                    {person.department ? ` · ${person.department}` : ''}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0">
                {getRoleLabel(person.role)}
              </Badge>
            </ListRow>
          ))
        )}
      </HomePanel>

      <HomePanel
        className="min-h-[320px]"
        title="Projects"
        count={workspace?.totals?.projects ?? projects.length}
      >
        {projects.length === 0 ? (
          <EmptyLine>No projects yet.</EmptyLine>
        ) : (
          projects.slice(0, 12).map((project) => (
            <ListRow key={project.id} onClick={() => navigate(projectPath(project.id))}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{project.name}</p>
                <p className="truncate text-xs text-graphite">
                  {project.key}
                  {project.team ? ` · ${project.team}` : ''}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </Badge>
            </ListRow>
          ))
        )}
      </HomePanel>

      <HomePanel
        className="min-h-[320px]"
        title="Open tasks"
        count={tasks.length}
      >
        {tasks.length === 0 ? (
          <EmptyLine>No open tasks.</EmptyLine>
        ) : (
          tasks.slice(0, 12).map((task) => (
            <ListRow
              key={task.id}
              onClick={() =>
                navigate(
                  task.projectId ? `/projects/${task.projectId}?task=${task.id}` : '/all-tasks'
                )
              }
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {task.key} · {formatTaskTitle(task)}
                </p>
                <p className="truncate text-xs text-graphite">
                  {task.projectKey || task.project || 'Project'}
                  {task.assignees?.length
                    ? ` · ${task.assignees.map((a) => a.name).join(', ')}`
                    : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-graphite sm:inline">
                  {PRIORITY_LABELS[task.priority] || task.priority}
                </span>
                <Badge variant="secondary">{STATUS_LABELS[task.status] || task.status}</Badge>
              </div>
            </ListRow>
          ))
        )}
      </HomePanel>
    </div>
  );
}
