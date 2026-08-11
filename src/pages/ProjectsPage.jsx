import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus } from 'lucide-react';
import { useLiveSpaces, useProjects } from '@/features/projects/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { PROJECT_STATUS_LABELS } from '@/features/projects/api/projectApi';
import { CreateMenuPopover } from '@/features/spaces/components/CreateMenuPopover';
import { QuickCreateKindModal } from '@/features/spaces/components/QuickCreateKindModal';
import { isProjectKind, projectPath } from '@/features/spaces/spaceKinds';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const QUICK_KINDS = new Set(['list', 'folder', 'sprint', 'doc', 'form', 'whiteboard']);

/** Projects catalog dashboard — excludes Spaces */
export default function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const canCreate = hasPermission(user, PERMISSIONS.PROJECT_CREATE);
  const { data, isLoading } = useProjects({ limit: 100 });
  useLiveSpaces();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [quickKind, setQuickKind] = useState(null);
  const addRef = useRef(null);

  const projects = useMemo(
    () => (data?.data ?? []).filter((p) => isProjectKind(p.kind)),
    [data]
  );

  const onCreateSelect = (id) => {
    if (!canCreate) {
      toast.error('You do not have permission to create projects');
      return;
    }
    if (QUICK_KINDS.has(id)) {
      setQuickKind(id);
      return;
    }
    if (id === 'dashboard') {
      navigate('/reports');
      return;
    }
    if (id === 'imports') {
      navigate('/settings');
      toast.message('Imports', { description: 'Use Settings to import data.' });
      return;
    }
    if (id === 'templates') {
      setQuickKind('list');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1366px] px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
            Projects
          </p>
          <h1 className="page-title">All Projects</h1>
          <p className="page-subtitle">
            Lists, folders, sprints, and docs — separate from Spaces.
          </p>
        </div>
        {canCreate && (
          <Button ref={addRef} onClick={() => setCreateMenuOpen((o) => !o)}>
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Add a list, folder, or sprint to organize project work."
          action={
            canCreate ? (
              <Button onClick={() => setCreateMenuOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project._id} to={projectPath(project._id)}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-soft-lift)]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: project.color || '#292524' }}
                      >
                        {(project.icon || project.name?.[0] || 'P').toString().slice(0, 1)}
                      </span>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
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
                    <p className="mt-2 text-xs font-medium text-ink">
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
        <>
          <CreateMenuPopover
            open={createMenuOpen}
            onClose={() => setCreateMenuOpen(false)}
            onSelect={onCreateSelect}
            anchorRef={addRef}
          />
          <QuickCreateKindModal
            open={Boolean(quickKind)}
            kind={quickKind}
            onClose={() => setQuickKind(null)}
          />
        </>
      )}
    </div>
  );
}
