import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useProjects } from '@/features/projects/hooks/useProjects';
import {
  useWorkspaceOverview,
  useProjectSummary,
  useTeamWorkload,
  useCompletionTrend,
} from '@/features/reports/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { UserAvatar } from '@/components/UserAvatar';
import { WorkspaceDirectory } from '@/features/reports/components/WorkspaceDirectory';
import { WorkloadAnalytics } from '@/features/reports/components/WorkloadAnalytics';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/features/tasks/api/taskApi';
import { formatTaskTitle } from '@/features/tasks/taskTitle';
import { getDashboardMeta } from '@/lib/permissions';
import { getRoleLabel } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { useChartTheme } from '@/lib/chartTheme';

function MetricCell({ label, value, alert = false, className }) {
  return (
    <div className={cn('flex flex-col px-4 py-3.5', className)}>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-graphite">
        {label}
      </span>
      <span
        className={cn(
          'mt-1.5 text-[1.625rem] font-semibold tabular-nums tracking-[-0.02em]',
          alert ? 'text-bloom-coral' : 'text-ink'
        )}
      >
        {value}
      </span>
    </div>
  );
}

function toChartEntries(map, labels = {}) {
  return Object.entries(map || {}).map(([key, value]) => ({
    name: labels[key] ?? key.replace(/_/g, ' '),
    value,
  }));
}

function ChartCard({ title, children }) {
  return (
    <Card className="flex min-h-[340px] flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-[13px] font-semibold tracking-[-0.01em]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center">{children}</CardContent>
    </Card>
  );
}

function ChartEmpty({ children }) {
  return <p className="w-full py-16 text-center text-sm text-graphite">{children}</p>;
}

/**
 * Shared workspace analytics body.
 * variant="home"  → Superadmin Home (heading is Home, no Reports chrome)
 * variant="page"  → /reports
 */
export function ReportsDashboard({ variant = 'page' }) {
  const isHome = variant === 'home';
  const user = useAuthStore((s) => s.user);
  const dashMeta = getDashboardMeta(user?.role);
  const chart = useChartTheme();
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ limit: 500 });
  const projects = projectsData?.data ?? [];
  const [scope, setScope] = useState('workspace');
  const [projectId, setProjectId] = useState('');

  const selectedId = scope === 'project' ? projectId || projects[0]?._id || '' : '';

  const { data: workspace, isLoading: workspaceLoading } = useWorkspaceOverview();
  const { data: summary, isLoading: summaryLoading } = useProjectSummary(selectedId);
  const { data: workload, isLoading: workloadLoading } = useTeamWorkload(selectedId);
  const { data: projectTrend, isLoading: trendLoading } = useCompletionTrend(selectedId);

  const isProject = scope === 'project' && Boolean(selectedId);
  const isLoading = isProject
    ? summaryLoading || workloadLoading || trendLoading
    : workspaceLoading;

  const statusData = useMemo(
    () => toChartEntries(isProject ? summary?.byStatus : workspace?.byStatus, STATUS_LABELS),
    [isProject, summary, workspace]
  );
  const priorityData = useMemo(
    () => toChartEntries(isProject ? summary?.byPriority : workspace?.byPriority, PRIORITY_LABELS),
    [isProject, summary, workspace]
  );
  const approvalData = useMemo(
    () =>
      toChartEntries(isProject ? summary?.byApproval : workspace?.byApproval, {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      }),
    [isProject, summary, workspace]
  );

  const trend = isProject ? projectTrend : workspace?.trend;
  const deptData = workspace?.byDepartment ?? [];

  const totals = isProject
    ? {
        tasks: summary?.totalTasks ?? 0,
        overdue: summary?.overdueTasks ?? 0,
        completionRate: summary?.completionRate ?? 0,
        pendingApproval: summary?.pendingApproval ?? 0,
        completedThisWeek: summary?.completedTasks ?? 0,
        inProgress: summary?.inProgressTasks ?? 0,
        projects: 1,
        people: 0,
        teams: 0,
      }
    : {
        tasks: workspace?.totals?.tasks ?? 0,
        overdue: workspace?.totals?.overdue ?? 0,
        completionRate: workspace?.totals?.completionRate ?? 0,
        pendingApproval: workspace?.totals?.pendingApproval ?? 0,
        completedThisWeek: workspace?.totals?.completedThisWeek ?? 0,
        projects: workspace?.totals?.projects ?? 0,
        teams: workspace?.totals?.teams ?? 0,
        people: workspace?.totals?.people ?? 0,
        inProgress: workspace?.byStatus?.in_progress ?? 0,
      };

  const openTasks = Math.max((totals.tasks || 0) - (workspace?.byStatus?.done || 0), 0);

  const scopeControls = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Select
        value={scope}
        onChange={(e) => {
          setScope(e.target.value);
          if (e.target.value === 'project' && !projectId && projects[0]) {
            setProjectId(projects[0]._id);
          }
        }}
        className="w-full sm:w-48"
      >
        <option value="workspace">All workspace</option>
        <option value="project">Single project</option>
      </Select>
      {scope === 'project' && (
        <Select
          value={selectedId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full sm:w-64"
        >
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );

  if (projectsLoading) {
    return (
      <div className="page-shell">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {isHome ? (
            <UserAvatar
              user={user}
              size="lg"
              rounded="xl"
              className="ring-1 ring-black/5 dark:ring-white/10"
            />
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className={isHome ? 'voice-line text-[1.75rem] text-ink' : 'page-title'}>
                {isHome ? 'Home' : 'Reports'}
              </h1>
              {isHome ? (
                <span className="rounded-md bg-cloud px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-charcoal">
                  {dashMeta.badge || getRoleLabel(user?.role)}
                </span>
              ) : null}
            </div>
            <p className={isHome ? 'mt-1 text-[13.5px] text-graphite' : 'page-subtitle'}>
              {isHome
                ? dashMeta.subtitle
                : 'Live members, projects, and tasks — plus completion, approvals, and team load.'}
            </p>
          </div>
        </div>
        {scopeControls}
      </div>

      {!isProject && workspace ? <WorkspaceDirectory workspace={workspace} /> : null}

      {!isProject && projects.length === 0 && !workspace?.totals?.tasks ? (
        <EmptyState
          icon={BarChart3}
          title="No work to report yet"
          description="Create projects and complete tasks to see live analytics."
        />
      ) : isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-hairline bg-paper shadow-xs lg:grid-cols-4">
            <MetricCell
              className="border-b border-r border-hairline lg:border-b-0"
              label={isProject ? 'Total tasks' : 'Projects'}
              value={isProject ? totals.tasks : totals.projects}
            />
            <MetricCell
              className="border-b border-hairline lg:border-b-0 lg:border-r"
              label="People"
              value={isProject ? '—' : totals.people}
            />
            <MetricCell
              className="border-r border-hairline max-lg:border-b"
              label="Open tasks"
              value={isProject ? totals.tasks : openTasks}
            />
            <MetricCell
              className="max-lg:border-b-0"
              label="Overdue"
              value={totals.overdue}
              alert={totals.overdue > 0}
            />
          </div>

          <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-xl border border-hairline bg-paper shadow-xs lg:grid-cols-4">
            <MetricCell
              className="border-b border-r border-hairline lg:border-b-0"
              label="In progress"
              value={totals.inProgress}
            />
            <MetricCell
              className="border-b border-hairline lg:border-b-0 lg:border-r"
              label="Completion"
              value={`${totals.completionRate}%`}
            />
            <MetricCell
              className="border-r border-hairline max-lg:border-b"
              label={isProject ? 'Pending approval' : 'Done this week'}
              value={isProject ? totals.pendingApproval : totals.completedThisWeek}
            />
            <MetricCell label="Pending approvals" value={totals.pendingApproval} />
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <ChartCard title="Tasks by status">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={86}
                      label={chart.pieLabel}
                    >
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={chart.pie[i % chart.pie.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chart.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty>No status data yet.</ChartEmpty>
              )}
            </ChartCard>

            <ChartCard title="Tasks by priority">
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="name" tick={chart.tickProps(12)} />
                    <YAxis allowDecimals={false} tick={chart.tickProps(12)} />
                    <Tooltip {...chart.tooltip} />
                    <Bar dataKey="value" fill={chart.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty>No priority data yet.</ChartEmpty>
              )}
            </ChartCard>

            <ChartCard title={isProject ? 'Team workload' : 'Open work by department'}>
              {isProject ? (
                workload && workload.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={workload} layout="vertical" margin={{ left: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                      <XAxis type="number" allowDecimals={false} tick={chart.tickProps(12)} />
                      <YAxis dataKey="name" type="category" width={110} tick={chart.tickProps(12)} />
                      <Tooltip {...chart.tooltip} />
                      <Bar dataKey="openTasks" fill={chart.secondary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmpty>No assignee workload yet.</ChartEmpty>
                )
              ) : deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="name" tick={chart.tickProps(12)} />
                    <YAxis allowDecimals={false} tick={chart.tickProps(12)} />
                    <Tooltip {...chart.tooltip} />
                    <Bar dataKey="openTasks" fill={chart.deep} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty>No department workload yet.</ChartEmpty>
              )}
            </ChartCard>

            <ChartCard title="Completion trend (14 days)">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="_id" tick={chart.tickProps(10)} />
                  <YAxis allowDecimals={false} tick={chart.tickProps(12)} />
                  <Tooltip {...chart.tooltip} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={chart.primary}
                    strokeWidth={2}
                    dot={{ fill: chart.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Approval pipeline">
              {approvalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={approvalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="name" tick={chart.tickProps(12)} />
                    <YAxis allowDecimals={false} tick={chart.tickProps(12)} />
                    <Tooltip {...chart.tooltip} />
                    <Bar dataKey="value" fill={chart.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty>No approval data yet.</ChartEmpty>
              )}
            </ChartCard>

            {!isProject ? (
              <ChartCard title="Recently completed">
                {(workspace?.recentCompletions || []).length === 0 ? (
                  <ChartEmpty>Completed work will appear here.</ChartEmpty>
                ) : (
                  <ul className="w-full divide-y divide-hairline">
                    {workspace.recentCompletions.map((item) => (
                      <li key={item.id} className="flex h-12 items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {item.key} · {formatTaskTitle(item)}
                          </p>
                          <p className="truncate text-xs text-graphite">
                            {item.projectKey || item.project}
                            {item.assignees?.length ? ` · ${item.assignees.join(', ')}` : ''}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </ChartCard>
            ) : null}
          </div>
        </>
      )}

      <div className="mt-6">
        <WorkloadAnalytics />
      </div>
    </div>
  );
}
