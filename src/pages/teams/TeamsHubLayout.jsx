import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTeams, useCreateTeam } from '@/features/teams/hooks/useTeams';
import { useDepartments, useCreateDepartment } from '@/features/departments/hooks/useDepartments';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { TeamsHubSidebar } from '@/features/teams/components/TeamsHubSidebar';
import { InviteModal } from '@/components/InviteModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { canManageOrg, DEPARTMENT_PRESETS, getMainDepartments, ROLES } from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export default function TeamsHubLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = canManageOrg(user?.role);
  const userCanInvite = hasPermission(user, PERMISSIONS.USER_INVITE);
  // Team leads manage members; only SA / Dept Head create teams
  const canCreateTeam =
    hasPermission(user, PERMISSIONS.TEAM_MANAGE) &&
    (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.DEPT_HEAD);
  const canCreateDept = hasPermission(user, PERMISSIONS.DEPARTMENT_MANAGE);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState('');
  const [inviteDepartmentId, setInviteDepartmentId] = useState('');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  const { data: teamsData } = useTeams({ limit: 100 });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });
  const createTeam = useCreateTeam();
  const createDepartment = useCreateDepartment();

  const teams = teamsData?.data ?? [];
  const departments = useMemo(
    () => getMainDepartments(departmentsData?.data ?? []),
    [departmentsData?.data]
  );
  const users = usersData?.data ?? [];

  const teamForm = useForm({
    defaultValues: { name: '', description: '', department: '', lead: '' },
  });

  const deptForm = useForm({
    defaultValues: {
      name: DEPARTMENT_PRESETS[0].name,
      description: '',
      code: DEPARTMENT_PRESETS[0].code,
    },
  });

  const contextValue = useMemo(
    () => ({
      teams,
      departments,
      users,
      openInvite: (opts = {}) => {
        setInviteTeamId(opts.teamId || '');
        setInviteDepartmentId(opts.departmentId || '');
        setInviteOpen(true);
      },
      openCreateTeam: () => canCreateTeam && setTeamModalOpen(true),
      openCreateDept: () => canCreateDept && setDeptModalOpen(true),
      canInvite: userCanInvite,
      canCreateTeam,
      canCreateDept,
      isSuperAdmin,
      navigate,
    }),
    [teams, departments, users, userCanInvite, canCreateTeam, canCreateDept, isSuperAdmin, navigate]
  );

  const onCreateTeam = (values) => {
    createTeam.mutate(values, {
      onSuccess: (team) => {
        setTeamModalOpen(false);
        teamForm.reset();
        if (team?._id) navigate(`/teams/${team._id}`);
      },
    });
  };

  const onCreateDept = (values) => {
    createDepartment.mutate(values, {
      onSuccess: () => {
        setDeptModalOpen(false);
        deptForm.reset({
          name: DEPARTMENT_PRESETS[0].name,
          description: '',
          code: DEPARTMENT_PRESETS[0].code,
        });
      },
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Mobile Teams sub-nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-hairline bg-paper px-2 py-2 md:hidden">
        {[
          { to: '/teams/people', label: 'People' },
          { to: '/teams/all', label: 'Teams' },
          { to: '/teams/org', label: 'Org' },
          { to: '/teams/analytics', label: 'Analytics' },
        ].map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-charcoal hover:bg-cloud"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="hidden md:flex">
          <TeamsHubSidebar onCreateTeam={() => setTeamModalOpen(true)} />
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto">
          <Outlet context={contextValue} />
        </div>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteTeamId('');
          setInviteDepartmentId('');
        }}
        defaultTeamId={inviteTeamId}
        defaultDepartmentId={inviteDepartmentId}
      />

      <Modal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="Create team">
        {!canCreateTeam ? (
          <p className="text-sm text-graphite">You do not have permission to create teams.</p>
        ) : (
          <form onSubmit={teamForm.handleSubmit(onCreateTeam)} className="space-y-4">
            {departments.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-ink">
                Create a department first.{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline"
                  onClick={() => {
                    setTeamModalOpen(false);
                    setDeptModalOpen(true);
                  }}
                >
                  New department
                </button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                {...teamForm.register('name', { required: 'Name is required' })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-dept">Department</Label>
              <Select
                id="team-dept"
                {...teamForm.register('department', { required: 'Department is required' })}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-lead">Team lead</Label>
              <Select id="team-lead" {...teamForm.register('lead', { required: 'Lead is required' })}>
                <option value="">Select lead</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-desc">Description</Label>
              <Textarea id="team-desc" {...teamForm.register('description')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTeamModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTeam.isPending || departments.length === 0}>
                {createTeam.isPending ? 'Creating…' : 'Create team'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={deptModalOpen} onClose={() => setDeptModalOpen(false)} title="Create department">
        <form onSubmit={deptForm.handleSubmit(onCreateDept)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-code">Code</Label>
            <Input
              id="dept-code"
              placeholder="seo, development, marketing…"
              list="dept-code-presets"
              {...deptForm.register('code', {
                required: true,
                pattern: {
                  value: /^[a-z0-9][a-z0-9_-]*$/,
                  message: 'Lowercase letters, numbers, _ or -',
                },
              })}
            />
            <datalist id="dept-code-presets">
              {DEPARTMENT_PRESETS.map((preset) => (
                <option key={preset.code} value={preset.code}>
                  {preset.name}
                </option>
              ))}
            </datalist>
            <p className="text-xs text-graphite">
              Unique slug for the department. Presets: seo, development, designing — or add a new one.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-name">Name</Label>
            <Input id="dept-name" {...deptForm.register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-description">Description</Label>
            <Textarea id="dept-description" {...deptForm.register('description')} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDepartment.isPending}>
              {createDepartment.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
