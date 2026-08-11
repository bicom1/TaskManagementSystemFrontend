import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Users, BarChart3 } from 'lucide-react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { PROJECT_STATUS_LABELS } from '@/features/projects/api/projectApi';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ limit: 5 });
  const { data: notificationsData } = useNotifications({ limit: 5 });

  const projects = projectsData?.data ?? [];
  const notifications = notificationsData?.data ?? [];
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const stats = [
    { label: 'Active projects', value: projects.filter((p) => p.status === 'active').length, icon: FolderKanban },
    { label: 'Total projects', value: projectsData?.pagination?.total ?? projects.length, icon: FolderKanban },
    { label: 'Unread alerts', value: unreadNotifications, icon: BarChart3 },
  ];

  if (projectsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1366px] px-4 py-10 lg:px-8">
      <div className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
          Dashboard
        </p>
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="page-subtitle">Here&apos;s what&apos;s happening across your workspace today.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cloud">
                <stat.icon className="h-6 w-6 text-charcoal" />
              </div>
              <div>
                <p className="text-2xl font-medium text-ink">{stat.value}</p>
                <p className="text-sm text-graphite">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <Link to="/projects">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </Link>
        <Link to="/people">
          <Button variant="outline">
            <Users className="h-4 w-4" />
            People
          </Button>
        </Link>
        <Link to="/inbox">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4" />
            Inbox
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle>Recent projects</CardTitle>
            <Link to="/projects" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {projects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create your first project to start managing tasks."
                action={
                  <Link to="/projects">
                    <Button>Create project</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-hairline">
                {projects.map((project) => (
                  <li key={project._id}>
                    <Link
                      to={`/projects/${project._id}`}
                      className="flex items-center justify-between py-3 hover:bg-cloud/50 -mx-2 px-2 rounded-md transition-colors"
                    >
                      <div>
                        <p className="font-medium text-ink">{project.name}</p>
                        <p className="text-xs text-graphite">{project.key}</p>
                      </div>
                      <Badge variant="secondary">{PROJECT_STATUS_LABELS[project.status] ?? project.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle>Recent notifications</CardTitle>
            <Link to="/inbox" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-graphite">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {notifications.map((n) => (
                  <li key={n._id} className="py-3">
                    <p className="text-sm text-ink">{n.message}</p>
                    <p className="mt-1 text-xs text-graphite">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
