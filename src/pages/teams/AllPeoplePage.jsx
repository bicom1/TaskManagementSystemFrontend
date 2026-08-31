import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useUsers } from '@/features/users/hooks/useUsers';
import { PeopleToolbar } from '@/features/teams/components/PeopleToolbar';
import { PersonCard } from '@/features/teams/components/PersonCard';
import { PersonDetailModal } from '@/features/teams/components/PersonDetailModal';
import { Button } from '@/components/ui/Button';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { getPersonStatus } from '@/lib/avatar';
import { ROLES } from '@/lib/roles';

function personTeamIds(person, teams) {
  const uid = String(person._id);
  return teams
    .filter((team) => {
      if (String(team.lead?._id ?? team.lead) === uid) return true;
      return (team.members || []).some((m) => String(m._id ?? m) === uid);
    })
    .map((t) => t._id);
}

function personManagerIds(person, teams, departments) {
  const ids = new Set();
  const uid = String(person._id);
  for (const team of teams) {
    const isMember =
      String(team.lead?._id ?? team.lead) === uid ||
      (team.members || []).some((m) => String(m._id ?? m) === uid);
    if (!isMember) continue;
    const leadId = team.lead?._id ?? team.lead;
    if (leadId && String(leadId) !== uid) ids.add(String(leadId));
  }
  const deptId = person.department?._id ?? person.department;
  if (deptId) {
    const dept = departments.find((d) => String(d._id) === String(deptId));
    const headId = dept?.head?._id ?? dept?.head;
    if (headId && String(headId) !== uid) ids.add(String(headId));
  }
  return [...ids];
}

export default function AllPeoplePage() {
  const { teams, departments, openInvite, canInvite, navigate } = useOutletContext();
  const { data, isLoading } = useUsers({ limit: 100 });
  const people = data?.data ?? [];

  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    team: '',
    role: '',
    manager: '',
    sort: 'name-asc',
    q: '',
  });

  const managers = useMemo(() => {
    const map = new Map();
    for (const team of teams) {
      if (team.lead?._id) map.set(team.lead._id, team.lead);
    }
    for (const dept of departments) {
      if (dept.head?._id) map.set(dept.head._id, dept.head);
    }
    for (const p of people) {
      if (
        p.role === ROLES.TEAM_LEAD ||
        p.role === ROLES.DEPT_HEAD ||
        p.role === ROLES.SUPER_ADMIN
      ) {
        map.set(p._id, p);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, departments, people]);

  const filtered = useMemo(() => {
    let list = [...people];
    const q = filters.q.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.jobTitle?.toLowerCase().includes(q)
      );
    }
    if (filters.status) {
      list = list.filter((p) => getPersonStatus(p) === filters.status);
    }
    if (filters.role) {
      list = list.filter((p) => p.role === filters.role);
    }
    if (filters.team) {
      list = list.filter((p) => personTeamIds(p, teams).includes(filters.team));
    }
    if (filters.manager) {
      list = list.filter((p) =>
        personManagerIds(p, teams, departments).includes(filters.manager)
      );
    }

    list.sort((a, b) => {
      if (filters.sort === 'name-desc') return b.name.localeCompare(a.name);
      if (filters.sort === 'role') return (a.role || '').localeCompare(b.role || '');
      if (filters.sort === 'recent') {
        const ta = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const tb = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return tb - ta;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [people, filters, teams, departments]);

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="page-title text-ink">All People</h1>
        {canInvite && (
          <Button
            onClick={openInvite}
            className="bg-ink text-on-ink hover:bg-ink/90"
          >
            Invite
          </Button>
        )}
      </div>

      <PeopleToolbar
        filters={filters}
        onChange={setFilters}
        teams={teams}
        managers={managers}
        view={view}
        onViewChange={setView}
      />

      <div className="mt-5">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No people match"
            description="Try clearing filters or invite teammates to the workspace."
            action={
              canInvite ? (
                <Button onClick={openInvite} className="bg-ink text-on-ink hover:bg-ink/90">
                  Invite
                </Button>
              ) : null
            }
          />
        ) : view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((person) => (
              <PersonCard key={person._id} person={person} onClick={setSelected} />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((person) => (
              <PersonCard key={person._id} person={person} onClick={setSelected} compact />
            ))}
          </div>
        )}
      </div>

      <PersonDetailModal
        person={selected}
        teams={teams}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onOpenTeam={(id) => navigate(`/teams/${id}`)}
      />
    </div>
  );
}
