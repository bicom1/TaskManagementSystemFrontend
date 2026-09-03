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
  Legend,
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Users,
  CheckCircle2,
  Clock3,
  Timer,
  ListTodo,
  Gauge,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { ROLES, getRoleLabel } from '@/lib/roles';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useWorkloadAnalytics } from '@/features/reports/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  const header = [
    'Name',
    'Role',
    'Department',
    'Assigned',
    'Completed',
    'Pending',
    'Overdue',
    'In progress',
    'Projects',
    'Workload',
    'Productivity %',
  ];
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(
      [
        `"${(row.name || '').replace(/"/g, '""')}"`,
        getRoleLabel(row.role),
        `"${(row.department || '').replace(/"/g, '""')}"`,
        row.assigned,
        row.completed,
        row.pending,
        row.overdue,
        row.inProgress,
        row.projects,
        row.workload,
        row.productivity,
      ].join(',')
    );
  }
  return `\ufeff${lines.join('\n')}`;
}

function printPdf(data, rangeLabel) {
  const people = data?.people || [];
  const summary = data?.summary || {};
  const html = `<!DOCTYPE html><html><head><title>Workload report</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1c1917; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p { color: #57534e; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
      th, td { border: 1px solid #e7e5e4; padding: 6px 8px; text-align: left; }
      th { background: #f5f5f4; }
      .cards { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; }
      .card { border: 1px solid #e7e5e4; padding: 10px 14px; min-width: 110px; }
      .card b { display: block; font-size: 18px; }
    </style></head><body>
    <h1>Workload &amp; productivity report</h1>
    <p>${rangeLabel}</p>
    <div class="cards">
      <div class="card">Assigned<b>${summary.assigned || 0}</b></div>
      <div class="card">Completed<b>${summary.completed || 0}</b></div>
      <div class="card">Pending<b>${summary.pending || 0}</b></div>
      <div class="card">Overdue<b>${summary.overdue || 0}</b></div>
      <div class="card">In progress<b>${summary.inProgress || 0}</b></div>
    </div>
    <table><thead><tr>
      <th>Name</th><th>Role</th><th>Dept</th><th>Assigned</th><th>Done</th>
      <th>Pending</th><th>Overdue</th><th>In progress</th><th>Workload</th><th>Prod %</th>
    </tr></thead><tbody>
    ${people
      .map(
        (r) => `<tr><td>${r.name}</td><td>${getRoleLabel(r.role)}</td><td>${r.department || '—'}</td>
        <td>${r.assigned}</td><td>${r.completed}</td><td>${r.pending}</td>
        <td>${r.overdue}</td><td>${r.inProgress}</td><td>${r.workload}</td><td>${r.productivity}</td></tr>`
      )
      .join('')}
    </tbody></table>
    </body></html>`;
  const w = window.open('', '_blank');
  if (!w) {
    toast.error('Allow pop-ups to download PDF');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export function WorkloadAnalytics() {
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;

  const [period, setPeriod] = useState('weekly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [userId, setUserId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');

  const params = useMemo(() => {
    const next = { period };
    if (period === 'custom') {
      if (from) next.from = from;
      if (to) next.to = to;
    }
    if (isSuperAdmin) {
      if (userId) next.userId = userId;
      if (teamId) next.teamId = teamId;
      if (departmentId) next.departmentId = departmentId;
      if (projectId) next.projectId = projectId;
    }
    return next;
  }, [period, from, to, userId, teamId, departmentId, projectId, isSuperAdmin]);

  const enabled = period !== 'custom' || Boolean(from && to);
  const { data, isLoading, isFetching } = useWorkloadAnalytics(params, enabled);

  const { data: usersRes } = useUsers({ limit: 200 });
  const { data: teamsRes } = useTeams({ limit: 100 });
  const { data: deptsRes } = useDepartments({ limit: 50 });
  const { data: projectsRes } = useProjects({ limit: 500 });

  const users = usersRes?.data ?? [];
  const teams = teamsRes?.data ?? [];
  const departments = deptsRes?.data ?? [];
  const projects = projectsRes?.data ?? [];

  const summary = data?.summary || {};
  const rangeLabel = data?.range
    ? `${format(new Date(data.range.from), 'MMM d, yyyy')} – ${format(new Date(data.range.to), 'MMM d, yyyy')}`
    : '';

  const exportBase = `workload-report-${format(new Date(), 'yyyy-MM-dd')}`;

  const cards = [
    { label: 'Assigned', value: summary.assigned || 0, icon: ListTodo },
    { label: 'Completed', value: summary.completed || 0, icon: CheckCircle2 },
    { label: 'Pending', value: summary.pending || 0, icon: Clock3 },
    { label: 'Overdue', value: summary.overdue || 0, icon: Timer, accent: true },
    { label: 'In progress', value: summary.inProgress || 0, icon: Gauge },
    { label: 'Workload score', value: summary.workload || 0, icon: Users },
  ];

  return (
    <section className="mt-14 border-t border-hairline pt-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
            Analytics
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Reporting &amp; workload
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-graphite">
            {isSuperAdmin
              ? 'Organization-wide productivity by person, team, department, and project.'
              : 'Your relevant assigned work, progress, and productivity for the selected period.'}
          </p>
          {rangeLabel ? (
            <p className="mt-1 text-xs text-graphite">{rangeLabel}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.people?.length}
            onClick={() => {
              downloadBlob(toCsv(data.people), `${exportBase}.csv`, 'text/csv;charset=utf-8');
              toast.success('CSV downloaded');
            }}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.people?.length}
            onClick={() => {
              downloadBlob(
                toCsv(data.people),
                `${exportBase}.xls`,
                'application/vnd.ms-excel'
              );
              toast.success('Excel file downloaded');
            }}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data}
            onClick={() => printPdf(data, rangeLabel)}
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-hairline bg-cloud/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-graphite">
          <Filter className="h-3.5 w-3.5" />
          Period
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'custom', label: 'Custom range' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                period === opt.id
                  ? 'border-ink bg-ink text-on-ink'
                  : 'border-hairline bg-paper text-graphite hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
        {isSuperAdmin && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </Select>
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {!enabled ? (
        <p className="py-8 text-center text-sm text-graphite">
          Choose a start and end date for the custom range.
        </p>
      ) : isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {isFetching ? (
            <p className="mb-3 text-xs text-graphite">Refreshing live data…</p>
          ) : null}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cloud">
                    <card.icon
                      className={`h-5 w-5 ${card.accent ? 'text-bloom-coral' : 'text-primary'}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-graphite">{card.label}</p>
                    <p
                      className={`text-2xl font-medium ${card.accent ? 'text-bloom-coral' : 'text-ink'}`}
                    >
                      {card.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Productivity trend</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.trend || []).length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ececed" />
                      <XAxis dataKey="date" tick={{ fill: '#8a8a93', fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#8a8a93', fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="completed" stroke="#6f64c4" strokeWidth={2} name="Completed" />
                      <Line type="monotone" dataKey="created" stroke="#8f83d4" strokeWidth={2} name="Created" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-graphite">No trend data in this range.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team activity</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.teams || []).length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.teams}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ececed" />
                      <XAxis dataKey="name" tick={{ fill: '#8a8a93', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#8a8a93', fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" fill="#6f64c4" name="Completed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="open" fill="#e9e7f7" name="Open" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-10 text-center text-sm text-graphite">No team activity yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>People workload</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {(data?.people || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-graphite">
                  No assigned work in this view.
                </p>
              ) : (
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-xs uppercase tracking-wide text-graphite">
                      <th className="py-2 pr-3 font-semibold">Person</th>
                      <th className="py-2 pr-3 font-semibold">Assigned</th>
                      <th className="py-2 pr-3 font-semibold">Completed</th>
                      <th className="py-2 pr-3 font-semibold">Pending</th>
                      <th className="py-2 pr-3 font-semibold">Overdue</th>
                      <th className="py-2 pr-3 font-semibold">In progress</th>
                      <th className="py-2 pr-3 font-semibold">Projects</th>
                      <th className="py-2 font-semibold">Prod.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.people.map((row) => (
                      <tr key={row.userId} className="border-b border-hairline/80">
                        <td className="py-3 pr-3">
                          <p className="font-medium text-ink">{row.name}</p>
                          <p className="text-xs text-graphite">
                            {getRoleLabel(row.role)}
                            {row.department ? ` · ${row.department}` : ''}
                          </p>
                        </td>
                        <td className="py-3 pr-3 text-ink">{row.assigned}</td>
                        <td className="py-3 pr-3 text-ink">{row.completed}</td>
                        <td className="py-3 pr-3 text-ink">{row.pending}</td>
                        <td className="py-3 pr-3 text-bloom-coral">{row.overdue}</td>
                        <td className="py-3 pr-3 text-ink">{row.inProgress}</td>
                        <td className="py-3 pr-3 text-ink">{row.projects}</td>
                        <td className="py-3 text-ink">{row.productivity}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {(data?.projects || []).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Projects in this range</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-hairline">
                  {data.projects.map((p) => (
                    <li key={p.projectId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {p.key ? `${p.key} · ` : ''}
                          {p.name}
                        </p>
                        <p className="text-xs text-graphite">
                          {p.assigned} assigned · {p.inProgress} in progress · {p.overdue} overdue
                        </p>
                      </div>
                      <p className="text-sm text-ink">{p.completed} completed</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
