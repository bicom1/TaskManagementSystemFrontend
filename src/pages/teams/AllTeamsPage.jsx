import { Building2, Plus, Users } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Spinner';
import { getAvatarColor, getInitials } from '@/lib/avatar';
import { DEPARTMENT_CODE_LABELS } from '@/lib/roles';

export default function AllTeamsPage() {
  const {
    teams,
    departments,
    openCreateTeam,
    openCreateDept,
    canCreateTeam,
    canCreateDept,
    isSuperAdmin,
    navigate,
  } = useOutletContext();

  return (
    <div className="px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">All Teams</h1>
          <p className="mt-1 text-sm text-graphite">
            {teams.length} team{teams.length === 1 ? '' : 's'} across {departments.length}{' '}
            department{departments.length === 1 ? '' : 's'}
          </p>
        </div>
        {(canCreateTeam || canCreateDept || isSuperAdmin) && (
          <div className="flex flex-wrap gap-2">
            {(canCreateDept || isSuperAdmin) && (
              <Button variant="outline" onClick={openCreateDept}>
                <Building2 className="h-4 w-4" />
                New department
              </Button>
            )}
            {(canCreateTeam || isSuperAdmin) && (
              <Button onClick={openCreateTeam} className="bg-ink text-on-ink hover:bg-ink/90">
                <Plus className="h-4 w-4" /> 
                New team
              </Button>
            )}
          </div>
        )}
      </div>

      {departments.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {departments.map((dept) => {
            const teamCount = teams.filter(
              (t) => String(t.department?._id ?? t.department) === String(dept._id)
            ).length;
            return (
              <div
                key={dept._id}
                className="rounded-xl border border-hairline bg-cloud px-4 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-graphite">
                  Department
                </p>
                <p className="mt-1 font-semibold text-ink">{dept.name}</p>
                <p className="mt-1 text-xs text-graphite">
                  {teamCount} teams · Head: {dept.head?.name ?? 'Unassigned'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description={
            departments.length === 0
              ? 'Create a department first, then add a team.'
              : 'Create a team to organize people like ClickUp.'
          }
          action={
            (canCreateTeam || canCreateDept || isSuperAdmin) ? (
              <Button
                onClick={
                  departments.length === 0 && (canCreateDept || isSuperAdmin)
                    ? openCreateDept
                    : openCreateTeam
                }
                className="bg-ink text-on-ink hover:bg-ink/90"
              >
                {departments.length === 0 ? 'Create department' : 'Create team'}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teams.map((team) => {
            const deptName =
              team.department?.name ||
              DEPARTMENT_CODE_LABELS[team.department?.code] ||
              'Department';
            const memberCount = (team.members?.length ?? 0) + (team.lead ? 1 : 0);
            const preview = [
              team.lead,
              ...(team.members || []).filter(
                (m) => String(m._id) !== String(team.lead?._id ?? team.lead)
              ),
            ]
              .filter(Boolean)
              .slice(0, 4);

            return (
              <button
                key={team._id}
                type="button"
                onClick={() => navigate(`/teams/${team._id}`)}
                className="text-left"
              >
                <Card className="h-full transition hover:border-steel hover:shadow-md">
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit">
                      {deptName}
                    </Badge>
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {team.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex -space-x-2">
                      {preview.map((member) => (
                        <div
                          key={member._id}
                          className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-paper text-[10px] font-bold text-white"
                          style={{
                            backgroundColor: getAvatarColor(member._id || member.name),
                          }}
                          title={member.name}
                        >
                          {getInitials(member.name)}
                        </div>
                      ))}
                      {memberCount > preview.length && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-paper bg-fog text-[10px] font-semibold text-graphite">
                          +{memberCount - preview.length}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-graphite">
                      Lead: {team.lead?.name ?? '—'} · {memberCount} people
                    </p>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
