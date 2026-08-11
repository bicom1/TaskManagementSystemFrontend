import { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, UserMinus, UserPlus } from 'lucide-react';
import {
  useTeam,
  useAddTeamMember,
  useRemoveTeamMember,
} from '@/features/teams/hooks/useTeams';
import { PersonCard } from '@/features/teams/components/PersonCard';
import { PersonDetailModal } from '@/features/teams/components/PersonDetailModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { canInvite, DEPARTMENT_CODE_LABELS, getRoleLabel } from '@/lib/roles';
import { useAuthStore } from '@/store/authStore';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const { teams, users, openInvite, navigate } = useOutletContext();
  const role = useAuthStore((s) => s.user?.role);
  const canManageMembers = canInvite(role);

  const { data: team, isLoading } = useTeam(teamId);
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [userId, setUserId] = useState('');

  const members = useMemo(() => {
    if (!team) return [];
    const list = [];
    if (team.lead) list.push({ ...team.lead, _isLead: true });
    for (const m of team.members || []) {
      if (String(m._id) !== String(team.lead?._id ?? team.lead)) {
        list.push(m);
      }
    }
    return list;
  }, [team]);

  const availableUsers = useMemo(() => {
    const memberIds = new Set(members.map((m) => String(m._id)));
    return users.filter((u) => !memberIds.has(String(u._id)));
  }, [users, members]);

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-8">
        <EmptyState
          title="Team not found"
          description="This team may have been removed."
          action={
            <Button asChild={false} onClick={() => navigate('/teams/all')}>
              Back to teams
            </Button>
          }
        />
      </div>
    );
  }

  const deptName =
    team.department?.name ||
    DEPARTMENT_CODE_LABELS[team.department?.code] ||
    'Department';

  return (
    <div className="px-4 py-6 lg:px-8">
      <Link
        to="/teams/all"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All Teams
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="secondary">{deptName}</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{team.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-graphite">
            {team.description || 'No description'}
          </p>
          <p className="mt-2 text-xs text-graphite">
            Lead: {team.lead?.name ?? '—'}
            {team.lead?.role ? ` · ${getRoleLabel(team.lead.role)}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageMembers && (
            <>
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Add member
              </Button>
              <Button
                onClick={() =>
                  openInvite({
                    teamId: team._id,
                    departmentId: team.department?._id || team.department,
                  })
                }
                className="bg-ink text-on-ink hover:bg-ink/90"
              >
                Invite
              </Button>
            </>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite">
        People ({members.length})
      </h2>

      {members.length === 0 ? (
        <EmptyState
          title="No members"
          description="Add people to this team to collaborate."
          action={
            canManageMembers ? (
              <Button onClick={() => setAddOpen(true)}>Add member</Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {members.map((person) => (
            <div key={person._id} className="relative">
              <PersonCard person={person} onClick={setSelected} />
              {person._isLead && (
                <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Lead
                </span>
              )}
              {canManageMembers && !person._isLead && (
                <button
                  type="button"
                  title="Remove from team"
                  onClick={() =>
                    removeMember.mutate({ teamId: team._id, userId: person._id })
                  }
                  className="absolute right-2 top-2 rounded-md bg-paper/90 p-1.5 text-graphite shadow hover:text-bloom-coral"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <PersonDetailModal
        person={selected}
        teams={teams}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onOpenTeam={(id) => navigate(`/teams/${id}`)}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add team member">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-user">Person</Label>
            <Select
              id="add-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">Select person</option>
              {availableUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} · {getRoleLabel(u.role)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!userId || addMember.isPending}
              onClick={() =>
                addMember.mutate(
                  { teamId: team._id, userId },
                  {
                    onSuccess: () => {
                      setAddOpen(false);
                      setUserId('');
                    },
                  }
                )
              }
            >
              {addMember.isPending ? 'Adding…' : 'Add to team'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
