import { Building2, Pencil, Plus, Trash2, Users } from 'lucide-react';
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
    openEditTeam,
    openDeleteTeam,
    openEditDept,
    openDeleteDept,
    canCreateTeam,
    canCreateDept,
    canManageTeams,
    isSuperAdmin,
    navigate,
  } = useOutletContext();

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title text-ink">All Teams</h1>
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
              <Button onClick={openCreateTeam} variant="ink">
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
                className="rounded-2xl border border-hairline bg-cloud/70 px-4 py-3 transition hover:bg-cloud"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-graphite">
                    Department
                  </p>
                  {canCreateDept && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Edit department"
                        aria-label={`Edit ${dept.name}`}
                        onClick={() => openEditDept(dept)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title={
                          teamCount > 0
                            ? `Move or delete this department's ${teamCount} team${
                                teamCount === 1 ? '' : 's'
                              } first`
                            : 'Delete department'
                        }
                        aria-label={`Delete ${dept.name}`}
                        className="text-danger-500 hover:text-danger-500 disabled:opacity-40"
                        disabled={teamCount > 0}
                        onClick={() => openDeleteDept(dept)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
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
            const people = [
              team.lead,
              ...(team.members || []),
            ].filter(Boolean);
            const uniquePeople = [];
            const seen = new Set();
            for (const person of people) {
              const id = String(person._id || person);
              if (seen.has(id)) continue;
              seen.add(id);
              uniquePeople.push(person);
            }
            const memberCount = uniquePeople.length;
            const preview = uniquePeople.slice(0, 6);

            return (
              <div
                key={team._id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/teams/${team._id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/teams/${team._id}`);
                  }
                }}
                className="cursor-pointer text-left"
              >
                <Card className="h-full transition hover:border-steel hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="w-fit">
                        {deptName}
                      </Badge>
                      {canManageTeams && (
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="Edit team"
                            aria-label={`Edit ${team.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditTeam(team);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="Delete team"
                            aria-label={`Delete ${team.name}`}
                            className="text-danger-500 hover:text-danger-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteTeam(team);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
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
                    </div>
                    <p className="text-xs text-graphite">
                      Lead: {team.lead?.name ?? '—'} · {memberCount}{' '}
                      {memberCount === 1 ? 'person' : 'people'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
