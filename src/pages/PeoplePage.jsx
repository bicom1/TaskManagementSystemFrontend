import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { InviteModal } from '@/components/InviteModal';
import { formatDistanceToNow } from 'date-fns';
import { canInvite, getRoleLabel } from '@/lib/roles';

export default function PeoplePage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [q, setQ] = useState('');
  const { data, isLoading } = useUsers({ limit: 100, q: q || undefined });
  const role = useAuthStore((s) => s.user?.role);
  const userCanInvite = canInvite(role);
  const people = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
            Workspace
          </p>
          <h1 className="page-title">People</h1>
          <p className="page-subtitle">Manage members. Invite by email or WhatsApp share link.</p>
        </div>
        {userCanInvite && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite people
          </Button>
        )}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people found"
          description="Invite teammates to collaborate on projects and tasks."
          action={
            userCanInvite ? (
              <Button onClick={() => setInviteOpen(true)}>Invite people</Button>
            ) : null
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-hairline">
              {people.map((person) => (
                <li key={person._id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-fog text-sm font-semibold text-ink">
                    {person.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-ink">{person.name}</p>
                      {person.jobTitle && (
                        <span className="text-sm text-graphite">{person.jobTitle}</span>
                      )}
                      {person.invitePending && (
                        <Badge variant="warning">Invite pending</Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-graphite">{person.email}</p>
                    {person.department?.name && (
                      <p className="truncate text-xs text-graphite">{person.department.name}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{getRoleLabel(person.role)}</Badge>
                  <p className="hidden text-xs text-graphite sm:block">
                    {person.lastLoginAt
                      ? `Active ${formatDistanceToNow(new Date(person.lastLoginAt), { addSuffix: true })}`
                      : 'Never signed in'}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
