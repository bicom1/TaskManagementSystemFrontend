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
import { BarChart3, CheckCircle2, Clock3, FolderKanban, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
import { STATUS_LABELS, PRIORITY_LABELS } from '@/features/tasks/api/taskApi';
import { WorkloadAnalytics } from '@/features/reports/components/WorkloadAnalytics';

const PIE_COLORS = ['#024ad8', '#296ef9', '#0e3191', '#c9e0fc', '#636363', '#3d3d3d'];

function toChartEntries(map, labels = {}) {
  return Object.entries(map || {}).map(([key, value]) => ({
    name: labels[key] ?? key.replace(/_/g, ' '),
    value,
  }));
}

export default function ReportsPage() {
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ limit: 100 });
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

  if (projectsLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  const totals = isProject
    ? {
        tasks: summary?.totalTasks ?? 0,
        overdue: summary?.overdueTasks ?? 0,
        completionRate: summary?.completionRate ?? 0,
        pendingApproval: summary?.pendingApproval ?? 0,
        completedThisWeek: summary?.completedTasks ?? 0,
        inProgress: summary?.inProgressTasks ?? 0,
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

  return (
    <div className="mx-auto max-w-[1366px] px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
            Insights
          </p>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Live metrics based on work completed, approvals, and team load.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
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
      </div>

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
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-graphite">{isProject ? 'Total tasks' : 'Projects'}</p>
                  <p className="text-2xl font-medium text-ink">
                    {isProject ? totals.tasks : totals.projects}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-graphite">Completion rate</p>
                  <p className="text-2xl font-medium text-ink">{totals.completionRate}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft">
                  <Clock3 className="h-5 w-5 text-bloom-coral" />
                </div>
                <div>
                  <p className="text-sm text-graphite">Overdue</p>
                  <p className="text-2xl font-medium text-bloom-coral">{totals.overdue}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-graphite">
                    {isProject ? 'Pending approval' : 'Done this week'}
                  </p>
                  <p className="text-2xl font-medium text-ink">
                    {isProject ? totals.pendingApproval : totals.completedThisWeek}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {!isProject && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-graphite">Open tasks</p>
                  <p className="text-2xl font-medium text-ink">
                    {Math.max((totals.tasks || 0) - (workspace?.byStatus?.done || 0), 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-graphite">In progress</p>
                  <p className="text-2xl font-medium text-ink">{totals.inProgress}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-graphite">Pending approvals</p>
                  <p className="text-2xl font-medium text-ink">{totals.pendingApproval}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tasks by status</CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-graphite">No status data yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by priority</CardTitle>
              </CardHeader>
              <CardContent>
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="name" tick={{ fill: '#636363', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#636363', fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#024ad8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-graphite">No priority data yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {isProject ? 'Team workload' : 'Open work by department'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isProject ? (
                  workload && workload.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={workload} layout="vertical" margin={{ left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: '#636363', fontSize: 12 }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={110}
                          tick={{ fill: '#636363', fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="openTasks" fill="#296ef9" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-10 text-center text-sm text-graphite">No assignee workload yet.</p>
                  )
                ) : deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={deptData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="name" tick={{ fill: '#636363', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#636363', fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="openTasks" fill="#0e3191" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-graphite">No department workload yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion trend (14 days)</CardTitle>
              </CardHeader>
              <CardContent>
                {trend && trend.some((d) => d.completed > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="_id" tick={{ fill: '#636363', fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#636363', fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#024ad8"
                        strokeWidth={2}
                        dot={{ fill: '#024ad8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="_id" tick={{ fill: '#636363', fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#636363', fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="completed" stroke="#024ad8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                {approvalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={approvalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="name" tick={{ fill: '#636363', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#636363', fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#296ef9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-graphite">No approval data yet.</p>
                )}
              </CardContent>
            </Card>

            {!isProject && (
              <Card>
                <CardHeader>
                  <CardTitle>Recently completed</CardTitle>
                </CardHeader>
                <CardContent>
                  {(workspace?.recentCompletions || []).length === 0 ? (
                    <p className="py-8 text-center text-sm text-graphite">
                      Completed work will appear here.
                    </p>
                  ) : (
                    <ul className="divide-y divide-hairline">
                      {workspace.recentCompletions.map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {item.key} · {item.title}
                            </p>
                            <p className="text-xs text-graphite">
                              {item.projectKey || item.project}
                              {item.assignees?.length
                                ? ` · ${item.assignees.join(', ')}`
                                : ''}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      <WorkloadAnalytics />
    </div>
  );
}
