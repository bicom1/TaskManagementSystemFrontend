import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Plus, Building2 } from 'lucide-react';
import { useTeams, useCreateTeam } from '@/features/teams/hooks/useTeams';
import { useDepartments, useCreateDepartment } from '@/features/departments/hooks/useDepartments';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { canManageOrg, DEPARTMENT_PRESETS, DEPARTMENT_CODE_LABELS } from '@/lib/roles';

export default function TeamsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = canManageOrg(user?.role);

  const { data, isLoading } = useTeams({ limit: 100 });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });
  const createTeam = useCreateTeam();
  const createDepartment = useCreateDepartment();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', description: '', department: '', lead: '' },
  });

  const deptForm = useForm({
    defaultValues: {
      name: DEPARTMENT_PRESETS[0].name,
      description: '',
      code: DEPARTMENT_PRESETS[0].code,
    },
  });

  const watchedCode = deptForm.watch('code');

  useEffect(() => {
    const preset = DEPARTMENT_PRESETS.find((p) => p.code === watchedCode);
    if (preset) deptForm.setValue('name', preset.name);
  }, [watchedCode, deptForm]);

  const teams = data?.data ?? [];
  const departments = departmentsData?.data ?? [];
  const users = usersData?.data ?? [];

  const onSubmit = (values) => {
    createTeam.mutate(values, {
      onSuccess: () => {
        setModalOpen(false);
        reset();
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

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1366px] px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
            Organization
          </p>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">
            SEO, Development, and UI/UX Designing teams across the workspace.
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDeptModalOpen(true)}>
              <Building2 className="h-4 w-4" />
              New department
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New team
            </Button>
          </div>
        )}
      </div>

      {departments.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {departments.map((dept) => (
            <Card key={dept._id} className="bg-cloud shadow-none">
              <CardContent className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-graphite">
                  Department
                </p>
                <p className="mt-1 text-lg font-medium text-ink">{dept.name}</p>
                <p className="mt-1 text-xs text-graphite">
                  Head: {dept.head?.name ?? 'Unassigned'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description={
            departments.length === 0
              ? 'Create a department first, then add a team.'
              : 'Create a team to assign projects and manage members.'
          }
          action={
            isSuperAdmin ? (
              departments.length === 0 ? (
                <Button onClick={() => setDeptModalOpen(true)}>Create department</Button>
              ) : (
                <Button onClick={() => setModalOpen(true)}>Create team</Button>
              )
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
            return (
              <Card key={team._id} className="h-full">
                <CardHeader>
                  <div className="mb-2">
                    <Badge variant="secondary">{deptName}</Badge>
                  </div>
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {team.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-xs text-graphite">
                    <p>Lead: {team.lead?.name ?? '—'}</p>
                    <p>{team.members?.length ?? 0} members</p>
                    {team.lead?.jobTitle && <p>{team.lead.jobTitle}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={deptModalOpen} onClose={() => setDeptModalOpen(false)} title="Create department">
        <form onSubmit={deptForm.handleSubmit(onCreateDept)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-code">Department type</Label>
            <Select id="dept-code" {...deptForm.register('code', { required: true })}>
              {DEPARTMENT_PRESETS.map((preset) => (
                <option key={preset.code} value={preset.code}>
                  {preset.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-name">Name</Label>
            <Input
              id="dept-name"
              {...deptForm.register('name', { required: 'Name is required' })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-description">Description</Label>
            <Textarea id="dept-description" {...deptForm.register('description')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDepartment.isPending}>
              {createDepartment.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create team">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team name</Label>
            <Input id="name" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-sm text-bloom-coral">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select id="department" {...register('department', { required: 'Department is required' })}>
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead">Team lead</Label>
            <Select id="lead" {...register('lead', { required: 'Lead is required' })}>
              <option value="">Select lead</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} {u.jobTitle ? `(${u.jobTitle})` : ''}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
