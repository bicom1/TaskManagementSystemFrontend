import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus } from 'lucide-react';
import { useLiveSpaces, useProjects } from '@/features/projects/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { PROJECT_STATUS_LABELS } from '@/features/projects/api/projectApi';
import { CreateSpaceWizard } from '@/features/spaces/components/CreateSpaceWizard';
import { projectPath } from '@/features/spaces/spaceKinds';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';

function sortByName(items) {
  return [...items].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), undefined, {
      sensitivity: 'base',
      numeric: true,
    })
  );
}

/** Projects catalog — all workspace projects */
export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const canCreate = hasPermission(user, PERMISSIONS.PROJECT_CREATE);
  const { data, isLoading } = useProjects({ limit: 100 });
  useLiveSpaces();

  const [wizardOpen, setWizardOpen] = useState(false);

  const projects = useMemo(
    () => sortByName(data?.data ?? []),
    [data]
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1366px] px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite">
            Projects
          </p>
          <h1 className="page-title">All Projects</h1>
          <p className="page-subtitle">
            Organize work with boards, lists, and team workflows.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to organize tasks and collaborate with your team."
          action={
            canCreate ? (
              <Button onClick={() => setWizardOpen(true)}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project._id} to={projectPath(project._id)} className="group">
              <Card className="h-full hover:border-primary/25 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-soft-lift transition group-hover:scale-[1.03]"
                        style={{ backgroundColor: project.color || '#1a1a1a' }}
                      >
                        {(project.icon || project.name?.[0] || 'P').toString().slice(0, 1)}
                      </span>
                      <div>
                        <CardTitle className="text-[15px] group-hover:text-primary-deep">
                          {project.name}
                        </CardTitle>
                        <p className="mt-0.5 text-[11px] font-medium capitalize text-graphite">
                          {(project.kind || 'project').replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">{project.key}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-graphite">
                    {project.description || 'No description'}
                  </p>
                  {project.openTaskCount > 0 && (
                    <p className="mt-3 inline-flex rounded-md bg-cloud px-2 py-1 text-xs font-semibold text-ink">
                      {project.openTaskCount} open task
                      {project.openTaskCount === 1 ? '' : 's'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {canCreate && (
        <CreateSpaceWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      )}
    </div>
  );
}
