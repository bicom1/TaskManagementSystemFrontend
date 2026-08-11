import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus } from 'lucide-react';
import { useLiveSpaces, useProjects } from '@/features/projects/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { PROJECT_STATUS_LABELS } from '@/features/projects/api/projectApi';
import { CreateSpaceWizard } from '@/features/spaces/components/CreateSpaceWizard';
import { isSpaceKind, spacePath } from '@/features/spaces/spaceKinds';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';

/** Spaces catalog dashboard — only Space entities */
export default function SpacesPage() {
  const user = useAuthStore((s) => s.user);
  const canCreate = hasPermission(user, PERMISSIONS.PROJECT_CREATE);
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data, isLoading } = useProjects({ limit: 100 });
  useLiveSpaces();

  const spaces = useMemo(
    () => (data?.data ?? []).filter((p) => isSpaceKind(p.kind)),
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
    <div className="mx-auto max-w-[1366px] px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
            Spaces
          </p>
          <h1 className="page-title">Spaces</h1>
          <p className="page-subtitle">
            Teams and workflows with their own lists, statuses, and views.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Space
          </Button>
        )}
      </div>

      {spaces.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No spaces yet"
          description="Create a Space to define a workflow and start adding tasks."
          action={
            canCreate ? (
              <Button onClick={() => setWizardOpen(true)}>Create Space</Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Link key={space._id} to={spacePath(space._id)}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-soft-lift)]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: space.color || '#292524' }}
                      >
                        {(space.icon || space.name?.[0] || 'S').toString().slice(0, 1)}
                      </span>
                      <CardTitle className="text-base">{space.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {PROJECT_STATUS_LABELS[space.status] ?? space.status}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">{space.key}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-graphite">
                    {space.description || 'No description'}
                  </p>
                  {space.workflowTemplate ? (
                    <p className="mt-2 text-xs capitalize text-graphite">
                      {String(space.workflowTemplate).replace(/_/g, ' ')}
                    </p>
                  ) : null}
                  {space.openTaskCount > 0 && (
                    <p className="mt-2 text-xs font-medium text-ink">
                      {space.openTaskCount} open task{space.openTaskCount === 1 ? '' : 's'}
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
