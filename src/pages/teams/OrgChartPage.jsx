import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { getRoleLabel } from '@/lib/roles';

function Node({ person, subtitle, onClick }) {
  if (!person) {
    return (
      <div className="rounded-xl border border-dashed border-steel/50 bg-cloud px-4 py-3 text-center text-xs text-graphite">
        Unassigned
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onClick?.(person)}
      className="flex min-w-[160px] items-center gap-3 rounded-xl border border-hairline bg-paper px-3 py-2.5 text-left shadow-sm transition hover:border-steel hover:shadow-md"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
        style={{ backgroundColor: getAvatarColor(person._id || person.name) }}
      >
        {getInitials(person.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
        <p className="truncate text-[11px] text-graphite">
          {subtitle || person.jobTitle || getRoleLabel(person.role)}
        </p>
      </div>
    </button>
  );
}

export default function OrgChartPage() {
  const { teams, departments, users, navigate } = useOutletContext();

  const superAdmins = useMemo(
    () => users.filter((u) => u.role === 'super_admin'),
    [users]
  );

  const openPersonTeams = (person) => {
    const team = teams.find(
      (t) =>
        String(t.lead?._id ?? t.lead) === String(person._id) ||
        (t.members || []).some((m) => String(m._id ?? m) === String(person._id))
    );
    if (team) navigate(`/teams/${team._id}`);
  };

  return (
    <div className="px-4 py-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">Org Chart</h1>
      <p className="mb-8 text-sm text-graphite">
        Workspace hierarchy by department and team lead.
      </p>

      <div className="mb-10 flex flex-col items-center gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-graphite">
          Super Admin
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {superAdmins.length === 0 ? (
            <Node person={null} />
          ) : (
            superAdmins.map((admin) => (
              <Node key={admin._id} person={admin} subtitle="Super Admin" />
            ))
          )}
        </div>
      </div>

      <div className="space-y-10">
        {departments.map((dept) => {
          const deptTeams = teams.filter(
            (t) => String(t.department?._id ?? t.department) === String(dept._id)
          );
          return (
            <section key={dept._id} className="rounded-2xl border border-hairline bg-cloud/40 p-5">
              <div className="mb-6 flex flex-col items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-graphite">
                  {dept.name}
                </p>
                <Node
                  person={dept.head}
                  subtitle="Department Head"
                  onClick={openPersonTeams}
                />
              </div>

              {deptTeams.length === 0 ? (
                <p className="text-center text-sm text-graphite">No teams in this department.</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {deptTeams.map((team) => {
                    const members = (team.members || []).filter(
                      (m) => String(m._id) !== String(team.lead?._id ?? team.lead)
                    );
                    return (
                      <div
                        key={team._id}
                        className="rounded-xl border border-hairline bg-paper p-4"
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/teams/${team._id}`)}
                          className="mb-3 text-sm font-semibold text-primary hover:underline"
                        >
                          {team.name}
                        </button>
                        <div className="mb-3">
                          <Node
                            person={team.lead}
                            subtitle="Team Lead"
                            onClick={openPersonTeams}
                          />
                        </div>
                        <div className="space-y-2">
                          {members.length === 0 ? (
                            <p className="text-xs text-graphite">No members yet</p>
                          ) : (
                            members.map((m) => (
                              <Node key={m._id} person={m} onClick={openPersonTeams} />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {departments.length === 0 && (
          <p className="text-center text-sm text-graphite">
            Create departments and teams to build your org chart.
          </p>
        )}
      </div>
    </div>
  );
}
