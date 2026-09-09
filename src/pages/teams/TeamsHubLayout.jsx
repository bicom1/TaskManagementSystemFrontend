import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  useTeams,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
} from '@/features/teams/hooks/useTeams';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/features/departments/hooks/useDepartments';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { InviteModal } from '@/components/InviteModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import {
  canManageOrg,
  DEPARTMENT_PRESETS,
  getSelectableDepartments,
  normalizeDepartmentCode,
} from '@/lib/roles';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export default function TeamsHubLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = canManageOrg(user?.role);
  const userCanInvite = hasPermission(user, PERMISSIONS.USER_INVITE);
  // Team leads and admins still manage members; the team itself
  // (create / edit / delete) is Super Admin only — mirrors the backend.
  const canManageTeams = isSuperAdmin;
  const canCreateTeam = canManageTeams;
  const canCreateDept = hasPermission(user, PERMISSIONS.DEPARTMENT_MANAGE);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState('');
  const [inviteDepartmentId, setInviteDepartmentId] = useState('');
  const [inviteTeamLeadId, setInviteTeamLeadId] = useState('');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [deletingTeam, setDeletingTeam] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);

  const { data: teamsData } = useTeams({ limit: 100 });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const teams = teamsData?.data ?? [];
  const departments = useMemo(
    () => getSelectableDepartments(departmentsData?.data ?? []),
    [departmentsData?.data]
  );

  // `code` and `name` are unique in Mongo, so suggesting a department that
  // already exists guarantees a 409. Only offer presets that are still free.
  const availableCodePresets = useMemo(() => {
    const taken = new Set(
      (departmentsData?.data ?? []).map((d) => normalizeDepartmentCode(d.code))
    );
    return DEPARTMENT_PRESETS.filter((preset) => !taken.has(preset.code));
  }, [departmentsData?.data]);
  const users = usersData?.data ?? [];

  const teamForm = useForm({
    defaultValues: { name: '', description: '', department: '', lead: '' },
  });

  const editTeamForm = useForm({
    defaultValues: { name: '', description: '', department: '', lead: '' },
  });

  const editDeptForm = useForm({
    defaultValues: { name: '', description: '' },
  });

  const deptForm = useForm({
    defaultValues: { name: '', description: '', code: '' },
  });

  // Prefill with a preset only while one is still unused, otherwise start blank.
  const nextDeptDefaults = useCallback(() => {
    const preset = availableCodePresets[0];
    return { name: preset?.name ?? '', description: '', code: preset?.code ?? '' };
  }, [availableCodePresets]);

  const contextValue = useMemo(
    () => ({
      teams,
      departments,
      users,
      openInvite: (opts = {}) => {
        setInviteTeamId(opts.teamId || '');
        setInviteDepartmentId(opts.departmentId || '');
        setInviteTeamLeadId(opts.teamLeadId || '');
        setInviteOpen(true);
      },
      openCreateTeam: () => canCreateTeam && setTeamModalOpen(true),
      openCreateDept: () => {
        if (!canCreateDept) return;
        deptForm.reset(nextDeptDefaults());
        setDeptModalOpen(true);
      },
      openEditTeam: (team) => {
        if (!canManageTeams || !team) return;
        editTeamForm.reset({
          name: team.name ?? '',
          description: team.description ?? '',
          department: String(team.department?._id ?? team.department ?? ''),
          lead: String(team.lead?._id ?? team.lead ?? ''),
        });
        setEditingTeam(team);
      },
      openDeleteTeam: (team) => {
        if (!canManageTeams || !team) return;
        setDeletingTeam(team);
      },
      openEditDept: (dept) => {
        if (!canCreateDept || !dept) return;
        editDeptForm.reset({
          name: dept.name ?? '',
          description: dept.description ?? '',
        });
        setEditingDept(dept);
      },
      openDeleteDept: (dept) => {
        if (!canCreateDept || !dept) return;
        setDeletingDept(dept);
      },
      canInvite: userCanInvite,
      canCreateTeam,
      canCreateDept,
      canManageTeams,
      isSuperAdmin,
      navigate,
    }),
    [
      teams,
      departments,
      users,
      userCanInvite,
      canCreateTeam,
      canCreateDept,
      canManageTeams,
      isSuperAdmin,
      editTeamForm,
      deptForm,
      editDeptForm,
      nextDeptDefaults,
      navigate,
    ]
  );

  const onEditDept = (values) => {
    if (!editingDept) return;
    updateDepartment.mutate(
      {
        id: editingDept._id,
        payload: {
          name: values.name.trim(),
          description: values.description?.trim() ?? '',
        },
      },
      {
        onSuccess: () => {
          setEditingDept(null);
          editDeptForm.reset();
        },
      }
    );
  };

  const onDeleteDept = () => {
    if (!deletingDept) return;
    deleteDepartment.mutate(deletingDept._id, {
      onSuccess: () => setDeletingDept(null),
    });
  };

  const onCreateTeam = (values) => {
    createTeam.mutate(values, {
      onSuccess: (team) => {
        setTeamModalOpen(false);
        teamForm.reset();
        if (team?._id) navigate(`/teams/${team._id}`);
      },
    });
  };

  const onEditTeam = (values) => {
    if (!editingTeam) return;
    updateTeam.mutate(
      {
        teamId: editingTeam._id,
        payload: {
          name: values.name.trim(),
          description: values.description?.trim() ?? '',
          department: values.department,
          lead: values.lead,
        },
      },
      {
        onSuccess: () => {
          setEditingTeam(null);
          editTeamForm.reset();
        },
      }
    );
  };

  const onDeleteTeam = () => {
    if (!deletingTeam) return;
    deleteTeam.mutate(deletingTeam._id, {
      onSuccess: () => setDeletingTeam(null),
    });
  };

  const onCreateDept = (values) => {
    createDepartment.mutate(values, {
      onSuccess: () => {
        setDeptModalOpen(false);
        deptForm.reset({ name: '', description: '', code: '' });
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
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-charcoal transition hover:bg-cloud hover:text-ink"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
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
          setInviteTeamLeadId('');
        }}
        defaultTeamId={inviteTeamId}
        defaultDepartmentId={inviteDepartmentId}
        defaultTeamLeadId={inviteTeamLeadId}
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

      <Modal
        open={Boolean(editingTeam)}
        onClose={() => setEditingTeam(null)}
        title="Edit team"
      >
        {!canManageTeams ? (
          <p className="text-sm text-graphite">
            Only a Superadmin can edit team details.
          </p>
        ) : (
          <form onSubmit={editTeamForm.handleSubmit(onEditTeam)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team name</Label>
              <Input
                id="edit-team-name"
                {...editTeamForm.register('name', { required: 'Name is required' })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-dept">Department</Label>
              <Select
                id="edit-team-dept"
                {...editTeamForm.register('department', { required: 'Department is required' })}
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
              <Label htmlFor="edit-team-lead">Team lead</Label>
              <Select
                id="edit-team-lead"
                {...editTeamForm.register('lead', { required: 'Lead is required' })}
              >
                <option value="">Select lead</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-desc">Description</Label>
              <Textarea id="edit-team-desc" {...editTeamForm.register('description')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingTeam(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTeam.isPending}>
                {updateTeam.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(deletingTeam)}
        onClose={() => setDeletingTeam(null)}
        title="Delete team"
      >
        {!canManageTeams ? (
          <p className="text-sm text-graphite">Only a Superadmin can delete teams.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-charcoal">
              Delete <span className="font-semibold text-ink">{deletingTeam?.name}</span>? The team
              is removed from every list. Its projects and tasks are kept.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeletingTeam(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onDeleteTeam}
                disabled={deleteTeam.isPending}
              >
                {deleteTeam.isPending ? 'Deleting…' : 'Delete team'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(editingDept)}
        onClose={() => setEditingDept(null)}
        title="Edit department"
      >
        <form onSubmit={editDeptForm.handleSubmit(onEditDept)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-dept-code">Code</Label>
            <Input id="edit-dept-code" value={editingDept?.code ?? ''} disabled readOnly />
            <p className="text-xs text-graphite">
              The code is the department&apos;s permanent identifier and cannot be changed.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-dept-name">Name</Label>
            <Input
              id="edit-dept-name"
              {...editDeptForm.register('name', { required: 'Name is required' })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-dept-description">Description</Label>
            <Textarea id="edit-dept-description" {...editDeptForm.register('description')} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingDept(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateDepartment.isPending}>
              {updateDepartment.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingDept)}
        onClose={() => setDeletingDept(null)}
        title="Delete department"
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal">
            Delete <span className="font-semibold text-ink">{deletingDept?.name}</span>? It is
            removed from every list and picker. Departments that still have teams cannot be
            deleted — move or delete those teams first.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeletingDept(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteDept}
              disabled={deleteDepartment.isPending}
            >
              {deleteDepartment.isPending ? 'Deleting…' : 'Delete department'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deptModalOpen} onClose={() => setDeptModalOpen(false)} title="Create department">
        <form onSubmit={deptForm.handleSubmit(onCreateDept)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-code">Code</Label>
            <Input
              id="dept-code"
              placeholder="seo, development, marketing…"
              // Hide the native datalist chevron — the suggestions still open on typing
              className="[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-list-button]:hidden"
              {...(availableCodePresets.length > 0 && { list: 'dept-code-presets' })}
              {...deptForm.register('code', {
                required: true,
                pattern: {
                  value: /^[a-z0-9][a-z0-9_-]*$/,
                  message: 'Lowercase letters, numbers, _ or -',
                },
              })}
            />
            {availableCodePresets.length > 0 && (
              <datalist id="dept-code-presets">
                {availableCodePresets.map((preset) => (
                  <option key={preset.code} value={preset.code} />
                ))}
              </datalist>
            )}
            <p className="text-xs text-graphite">
              Unique slug for the department — it must not match an existing one.
              {availableCodePresets.length > 0
                ? ` Still free: ${availableCodePresets.map((p) => p.code).join(', ')}.`
                : ' All built-in presets are taken, so pick a new one.'}
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
