import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Users,
  Bell,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { PROJECT_STATUS_LABELS } from '@/features/projects/api/projectApi';
import { formatDistanceToNow } from 'date-fns';

/**
 * DashboardPage — BIWORKSPACE
 *
 * Premium overview with:
 * - Gradient welcome header
 * - KPI StatCards with gradient icon backgrounds
 * - Quick action buttons
 * - Recent projects + notifications panels
 */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ limit: 5 });
  const { data: notificationsData } = useNotifications({ limit: 5 });

  const projects = projectsData?.data ?? [];
  const notifications = notificationsData?.data ?? [];
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const totalProjects = projectsData?.pagination?.total ?? projects.length;

  const stats = [
    {
      label: 'Active projects',
      value: activeProjects,
      icon: FolderKanban,
      color: 'brand',
    },
    {
      label: 'Total projects',
      value: totalProjects,
      icon: TrendingUp,
      color: 'success',
    },
    {
      label: 'Unread alerts',
      value: unreadNotifications,
      icon: Bell,
      color: unreadNotifications > 0 ? 'warning' : 'neutral',
    },
  ];

  // Status → Badge variant mapping
  const statusVariant = {
    active: 'success',
    completed: 'secondary',
    archived: 'secondary',
    on_hold: 'warning',
    cancelled: 'danger',
  };

  if (projectsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10">
        <LoadingScreen />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-[1300px] px-5 py-8 lg:px-8 lg:py-10 animate-fade-in">

      {/* ── Welcome Header ── */}
      <div className="mb-8">
        <p className="section-label mb-2 text-text-muted">Dashboard</p>
        <h1 className="page-title text-text-primary">
          {greeting},{' '}
          <span className="gradient-brand-text">{firstName}</span> 👋
        </h1>
        <p className="page-subtitle text-text-muted mt-1.5">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      {/* ── KPI Stats ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
          />
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="mb-8 flex flex-wrap items-center gap-2.5">
        <Link to="/projects">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New project
          </Button>
        </Link>
        <Link to="/people">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            People
          </Button>
        </Link>
        <Link to="/inbox">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Inbox
          </Button>
        </Link>
        <Link to="/home/my-tasks">
          <Button variant="outline" size="sm" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            My tasks
          </Button>
        </Link>
      </div>

      {/* ── Data Panels ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle>Recent projects</CardTitle>
            <Link
              to="/projects"
              className="flex items-center gap-1 text-[12px] font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {projects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create your first project to start managing tasks and collaborating with your team."
                action={
                  <Link to="/projects">
                    <Button size="sm">Create project</Button>
                  </Link>
                }
              />
            ) : (
              <ul>
                {projects.map((project) => (
                  <li key={project._id}>
                    <Link
                      to={`/projects/${project._id}`}
                      className="group flex items-center justify-between -mx-2 rounded-xl px-2 py-2.5 transition-all duration-[120ms] hover:bg-surface-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Project color dot */}
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: project.color || 'var(--color-brand-600)' }}
                        >
                          {(project.icon || project.name?.[0] || 'P').toString().slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-text-primary truncate group-hover:text-brand-600 transition-colors">
                            {project.name}
                          </p>
                          <p className="text-[11px] text-text-muted">{project.key}</p>
                        </div>
                      </div>
                      <Badge variant={statusVariant[project.status] ?? 'secondary'}>
                        {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle>Recent notifications</CardTitle>
            <Link
              to="/inbox"
              className="flex items-center gap-1 text-[12px] font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="All caught up"
                description="No new notifications. You're up to date!"
              />
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n._id} className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
                    {/* Unread indicator */}
                    <div className="mt-1 shrink-0">
                      {!n.isRead
                        ? <span className="block h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                        : <span className="block h-2 w-2 rounded-full bg-surface-3" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] leading-snug ${n.isRead ? 'text-text-muted' : 'text-text-primary font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-text-muted">
                        <Clock className="h-3 w-3 opacity-60" />
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
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
