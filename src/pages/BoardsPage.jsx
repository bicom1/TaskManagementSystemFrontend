import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { PROJECT_STATUS_LABELS } from '@/features/projects/api/projectApi';

export default function BoardsPage() {
  const { data, isLoading } = useProjects({ limit: 50 });
  const projects = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1366px] px-4 py-8 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
          Views
        </p>
        <h1 className="page-title">Boards</h1>
        <p className="page-subtitle">Open a Kanban board for any project space.</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No boards yet"
          description="Create a project to get a Kanban board."
          action={
            <Link to="/projects">
              <Button>Go to projects</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{project.name}</CardTitle>
                    <Badge variant="secondary">
                      {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                    </Badge>
                  </div>
                  <CardDescription>Board · {project.key}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-graphite">
                    {project.description || 'Open board to manage backlog through done.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
