import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Building2, UserRound, UserPlus } from 'lucide-react';
import { getPersonStatus } from '@/lib/avatar';
import { getRoleLabel, ROLE_LABELS } from '@/lib/roles';

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-hairline bg-paper p-4 shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-cloud text-ink">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm font-medium text-charcoal">{label}</p>
      {hint && <p className="mt-1 text-xs text-graphite">{hint}</p>}
    </div>
  );
}

export default function TeamsAnalyticsPage() {
  const { teams, departments, users } = useOutletContext();

  const stats = useMemo(() => {
    const byRole = {};
    for (const key of Object.keys(ROLE_LABELS)) byRole[key] = 0;
    let invited = 0;
    let online = 0;
    for (const u of users) {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
      const status = getPersonStatus(u);
      if (status === 'invited') invited += 1;
      if (status === 'online' || status === 'active') online += 1;
    }

    const teamSizes = teams.map((t) => ({
      name: t.name,
      size: (t.members?.length ?? 0) + (t.lead ? 1 : 0),
      department: t.department?.name || '—',
    }));
    teamSizes.sort((a, b) => b.size - a.size);

    return { byRole, invited, online, teamSizes };
  }, [users, teams]);

  const maxTeamSize = Math.max(1, ...stats.teamSizes.map((t) => t.size));

  return (
    <div className="px-4 py-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">Analytics</h1>
      <p className="mb-8 text-sm text-graphite">People and team health across the workspace.</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserRound} label="All people" value={users.length} />
        <StatCard icon={Users} label="Teams" value={teams.length} />
        <StatCard icon={Building2} label="Departments" value={departments.length} />
        <StatCard
          icon={UserPlus}
          label="Pending invites"
          value={stats.invited}
          hint={`${stats.online} active recently`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-hairline bg-paper p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Account types</h2>
          <ul className="space-y-3">
            {Object.entries(stats.byRole).map(([role, count]) => (
              <li key={role} className="flex items-center justify-between text-sm">
                <span className="text-charcoal">{getRoleLabel(role)}</span>
                <span className="font-semibold text-ink">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-hairline bg-paper p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Team sizes</h2>
          {stats.teamSizes.length === 0 ? (
            <p className="text-sm text-graphite">No teams yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.teamSizes.slice(0, 8).map((team) => (
                <li key={team.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate text-charcoal">{team.name}</span>
                    <span className="font-semibold text-ink">{team.size}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-cloud">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(team.size / maxTeamSize) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-graphite">{team.department}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
