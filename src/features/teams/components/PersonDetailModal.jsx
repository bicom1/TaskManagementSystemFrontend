import { formatDistanceToNow } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getPersonStatus, PERSON_STATUS_LABELS } from '@/lib/avatar';
import { getRoleLabel, ROLES } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';
import { useDeactivateUser, useUpdateUser } from '@/features/users/hooks/useUsers';
import { UserAvatar } from '@/components/UserAvatar';

export function PersonDetailModal({ person, teams = [], open, onClose, onOpenTeam }) {
  const user = useAuthStore((s) => s.user);
  const deactivate = useDeactivateUser();
  const updateUser = useUpdateUser();

  if (!person) return null;

  const status = getPersonStatus(person);
  const memberOf = teams.filter((team) => {
    const uid = String(person._id);
    if (String(team.lead?._id ?? team.lead) === uid) return true;
    return (team.members || []).some((m) => String(m._id ?? m) === uid);
  });

  const canManage =
    hasPermission(user, PERMISSIONS.USER_MANAGE) &&
    String(person._id) !== String(user?._id) &&
    person.role !== ROLES.SUPER_ADMIN;

  return (
    <Modal open={open} onClose={onClose} title="Member profile" size="md">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <UserAvatar user={person} size="xl" rounded="xl" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-ink">{person.name}</h3>
            <p className="text-sm text-graphite">{person.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{getRoleLabel(person.role)}</Badge>
              <Badge variant="outline">{PERSON_STATUS_LABELS[status]}</Badge>
              {person.invitePending && <Badge variant="warning">Invite pending</Badge>}
              {!person.isActive && <Badge variant="warning">Deactivated</Badge>}
            </div>
          </div>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Job title</dt>
            <dd className="mt-0.5 text-ink">{person.jobTitle || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Department</dt>
            <dd className="mt-0.5 text-ink">{person.department?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Last active</dt>
            <dd className="mt-0.5 text-ink">
              {person.lastLoginAt
                ? formatDistanceToNow(new Date(person.lastLoginAt), { addSuffix: true })
                : 'Never signed in'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">Auth</dt>
            <dd className="mt-0.5 text-ink capitalize">{person.authProvider || 'local'}</dd>
          </div>
        </dl>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite">Teams</p>
          {memberOf.length === 0 ? (
            <p className="text-sm text-graphite">Not on any team yet.</p>
          ) : (
            <ul className="space-y-1">
              {memberOf.map((team) => (
                <li key={team._id}>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => {
                      onClose();
                      onOpenTeam?.(team._id);
                    }}
                  >
                    {team.name}
                    {String(team.lead?._id ?? team.lead) === String(person._id) ? ' (Lead)' : ''}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {canManage && person.isActive !== false && (
            <Button
              variant="outline"
              disabled={deactivate.isPending}
              onClick={() =>
                deactivate.mutate(person._id, {
                  onSuccess: () => onClose(),
                })
              }
            >
              Deactivate
            </Button>
          )}
          {canManage && person.isActive === false && (
            <Button
              variant="outline"
              disabled={updateUser.isPending}
              onClick={() =>
                updateUser.mutate(
                  { id: person._id, isActive: true },
                  { onSuccess: () => onClose() }
                )
              }
            >
              Reactivate
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
