import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  UserRound,
  Network,
  Radio,
  Plus,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useUsers } from '@/features/users/hooks/useUsers';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { ROLES } from '@/lib/roles';
import { cn } from '@/lib/utils';

const hubNav = [
  { to: '/teams/all', label: 'All Teams', icon: Users, end: true },
  { to: '/teams/people', label: 'All People', icon: UserRound, badge: 'people' },
  { to: '/teams/org', label: 'Org Chart', icon: Network },
  { to: '/teams/analytics', label: 'Analytics', icon: Radio },
];

export function TeamsHubSidebar({ onCreateTeam }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const canCreateTeam =
    hasPermission(user, PERMISSIONS.TEAM_MANAGE) &&
    (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.DEPT_HEAD);
  const { data: teamsData } = useTeams({ limit: 100 });
  const { data: peopleData } = useUsers({ limit: 100 });

  const teams = teamsData?.data ?? [];
  const peopleCount = peopleData?.pagination?.total ?? peopleData?.data?.length ?? 0;

  const myTeams = teams.filter((team) => {
    const uid = String(user?._id);
    if (!uid) return false;
    if (String(team.lead?._id ?? team.lead) === uid) return true;
    return (team.members || []).some((m) => String(m._id ?? m) === uid);
  });

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-hairline bg-paper">
      <div className="flex h-12 items-center justify-between border-b border-hairline px-3.5">
        <p className="text-sm font-semibold tracking-tight text-ink">Teams</p>
        {canCreateTeam && (
          <button
            type="button"
            onClick={onCreateTeam}
            className="rounded-lg p-1.5 text-graphite transition hover:bg-cloud hover:text-ink"
            title="Create team"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="space-y-0.5 p-2">
        {hubNav.map((item) => {
          const Icon = item.icon;
          const badge = item.badge === 'people' ? peopleCount : null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cloud text-ink shadow-soft-lift'
                    : 'text-charcoal hover:bg-cloud/70 hover:text-ink'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {badge != null && badge > 0 && (
                <span className="rounded-md bg-fog px-1.5 py-0.5 text-[11px] font-semibold text-graphite">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-2 border-t border-hairline px-2 py-3">
        <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-graphite">
          My teams
        </p>
        <div className="space-y-0.5">
          {myTeams.length === 0 ? (
            <p className="px-2 py-2 text-xs text-graphite">No teams yet</p>
          ) : (
            myTeams.slice(0, 8).map((team) => (
              <button
                key={team._id}
                type="button"
                onClick={() => navigate(`/teams/${team._id}`)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-charcoal transition hover:bg-cloud"
              >
                <Building2 className="h-3.5 w-3.5 shrink-0 text-graphite" />
                <span className="truncate">{team.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
