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
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-hairline bg-paper">
      <div className="flex h-12 items-center justify-between border-b border-hairline px-4">
        <p className="text-sm font-semibold text-ink">Teams</p>
        {canCreateTeam && (
          <button
            type="button"
            onClick={onCreateTeam}
            className="rounded p-1 text-graphite hover:bg-cloud hover:text-ink"
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
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cloud text-ink'
                    : 'text-charcoal hover:bg-cloud/70 hover:text-ink'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {badge != null && badge > 0 && (
                <span className="rounded bg-fog px-1.5 py-0.5 text-[11px] font-semibold text-graphite">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-hairline px-2 pt-3">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite">
          My Teams
        </p>
        {myTeams.length === 0 ? (
          <div className="mx-2 rounded-md border border-dashed border-steel/50 px-3 py-4 text-center text-xs text-graphite">
            Once you are added to a Team you will see it here.
          </div>
        ) : (
          <div className="space-y-0.5">
            {myTeams.map((team) => (
              <button
                key={team._id}
                type="button"
                onClick={() => navigate(`/teams/${team._id}`)}
                className="flex w-full items-center gap-2 truncate rounded-md px-3 py-2 text-left text-sm text-charcoal hover:bg-cloud hover:text-ink"
              >
                <Building2 className="h-3.5 w-3.5 shrink-0 text-graphite" />
                <span className="truncate">{team.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
