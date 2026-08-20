import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Mail, MessageCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useInviteUser } from '@/features/users/hooks/useUsers';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useAuthStore } from '@/store/authStore';
import {
  getInviteRoleLabel,
  getInvitableRolesForDepartment,
  getMainDepartments,
  resolveDepartmentCode,
  ROLES,
} from '@/lib/roles';
import { canInvite as canInviteByRole } from '@/lib/roles';
import { getInvitableRoles, hasPermission, PERMISSIONS } from '@/lib/permissions';

function buildWhatsAppUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

const CUSTOM_VALUE = '__custom__';

export function InviteModal({ open, onClose, defaultTeamId = '', defaultDepartmentId = '' }) {
  const invite = useInviteUser();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const inviterName = user?.name || 'A teammate';
  const userCanInvite =
    canInviteByRole(role) ||
    hasPermission(user, PERMISSIONS.USER_INVITE) ||
    role === ROLES.SUPER_ADMIN;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: teamsData } = useTeams({ limit: 100 });
  const allDepartments = departmentsData?.data ?? [];
  const mainDepartments = useMemo(() => getMainDepartments(allDepartments), [allDepartments]);
  const otherDepartments = useMemo(() => {
    const mainIds = new Set(mainDepartments.map((d) => String(d._id)));
    return allDepartments.filter((d) => !mainIds.has(String(d._id)));
  }, [allDepartments, mainDepartments]);
  const teams = teamsData?.data ?? [];

  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const invitableByActor = useMemo(() => getInvitableRoles(role), [role]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      name: '',
      department: defaultDepartmentId || '',
      departmentName: '',
      role: ROLES.EMPLOYEE,
      team: defaultTeamId || '',
      teamName: '',
      teamLead: '',
      setAsTeamLead: false,
    },
  });

  const selectedDepartment = watch('department');
  const departmentName = watch('departmentName');
  const selectedRole = watch('role');
  const selectedTeam = watch('team');
  const teamName = watch('teamName');
  const isCustomDepartment = selectedDepartment === CUSTOM_VALUE;
  const isCustomTeam = selectedTeam === CUSTOM_VALUE;

  const selectedDeptDoc = useMemo(() => {
    if (isCustomDepartment) return { name: departmentName, code: resolveDepartmentCode(departmentName) };
    const fromMain = mainDepartments.find((d) => String(d._id) === String(selectedDepartment));
    if (fromMain) return fromMain;
    return allDepartments.find((d) => String(d._id) === String(selectedDepartment));
  }, [
    isCustomDepartment,
    departmentName,
    mainDepartments,
    allDepartments,
    selectedDepartment,
  ]);

  const selectedDeptCode = resolveDepartmentCode(selectedDeptDoc);
  const hasDepartment = Boolean(
    (selectedDepartment && selectedDepartment !== CUSTOM_VALUE) ||
      (isCustomDepartment && departmentName?.trim())
  );

  const rolesForDepartment = useMemo(() => {
    if (isSuperAdmin) {
      const withoutSa = invitableByActor.filter((r) => r !== ROLES.SUPER_ADMIN);
      const deptRoles =
        hasDepartment && selectedDeptCode && !isCustomDepartment
          ? getInvitableRolesForDepartment(ROLES.SUPER_ADMIN, selectedDeptCode, withoutSa)
          : withoutSa;
      return [ROLES.SUPER_ADMIN, ...deptRoles];
    }
    if (!hasDepartment) return [];
    if (!selectedDeptCode || isCustomDepartment) return invitableByActor;
    return getInvitableRolesForDepartment(role, selectedDeptCode, invitableByActor);
  }, [
    hasDepartment,
    selectedDeptCode,
    isCustomDepartment,
    isSuperAdmin,
    role,
    invitableByActor,
  ]);

  const teamsInDepartment = useMemo(() => {
    if (isCustomDepartment || !selectedDepartment || selectedDepartment === CUSTOM_VALUE) return [];
    return teams.filter(
      (t) => String(t.department?._id || t.department) === String(selectedDepartment)
    );
  }, [teams, selectedDepartment, isCustomDepartment]);

  const teamLeadsInDepartment = useMemo(() => {
    const leads = [];
    const seen = new Set();
    for (const t of teamsInDepartment) {
      const lead = t.lead;
      if (!lead?._id) continue;
      const id = String(lead._id);
      if (seen.has(id)) continue;
      seen.add(id);
      leads.push(lead);
    }
    return leads;
  }, [teamsInDepartment]);

  const selectedTeamDoc = useMemo(
    () => teams.find((t) => t._id === selectedTeam),
    [teams, selectedTeam]
  );

  useEffect(() => {
    if (!open) return;
    const defaultRole = invitableByActor.includes(ROLES.EMPLOYEE)
      ? ROLES.EMPLOYEE
      : invitableByActor[0] || ROLES.EMPLOYEE;
    reset({
      email: '',
      name: '',
      department: defaultDepartmentId || '',
      departmentName: '',
      role: defaultRole,
      team: defaultTeamId || '',
      teamName: '',
      teamLead: '',
      setAsTeamLead: false,
    });
    setResult(null);
  }, [open, defaultTeamId, defaultDepartmentId, reset, invitableByActor]);

  useEffect(() => {
    if (!selectedDepartment || selectedDepartment === CUSTOM_VALUE) return;
    const team = teams.find((t) => t._id === selectedTeam);
    const teamDept = team?.department?._id || team?.department;
    if (selectedTeam && selectedTeam !== CUSTOM_VALUE && String(teamDept) !== String(selectedDepartment)) {
      setValue('team', '');
      setValue('teamName', '');
      setValue('teamLead', '');
    }
  }, [selectedDepartment, selectedTeam, teams, setValue]);

  useEffect(() => {
    if (!hasDepartment && selectedRole !== ROLES.SUPER_ADMIN) return;
    if (!rolesForDepartment.length) return;
    if (!rolesForDepartment.includes(selectedRole)) {
      setValue('role', rolesForDepartment[0]);
    }
  }, [hasDepartment, rolesForDepartment, selectedRole, setValue]);

  useEffect(() => {
    if (!selectedTeam || selectedTeam === CUSTOM_VALUE) return;
    const team = teams.find((t) => t._id === selectedTeam);
    if (!team) return;
    const deptId = team.department?._id || team.department;
    if (deptId) setValue('department', String(deptId));
    if (team.lead?._id) setValue('teamLead', String(team.lead._id));
  }, [selectedTeam, teams, setValue]);

  const resetAll = () => {
    reset({
      email: '',
      name: '',
      department: defaultDepartmentId || '',
      departmentName: '',
      role: ROLES.EMPLOYEE,
      team: defaultTeamId || '',
      teamName: '',
      teamLead: '',
      setAsTeamLead: false,
    });
    setResult(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const onSubmit = (values) => {
    const usingCustomDept = values.department === CUSTOM_VALUE;
    const usingCustomTeam = values.team === CUSTOM_VALUE;

    if (usingCustomDept && !values.departmentName?.trim()) {
      toast.error('Type a department name, or pick one from the list');
      return;
    }
    if (values.role !== ROLES.SUPER_ADMIN && !usingCustomDept && !values.department) {
      toast.error('Select a department so you can assign the correct role');
      return;
    }
    if (!values.role) {
      toast.error('Select a role for this invite');
      return;
    }
    if (usingCustomTeam && !values.teamName?.trim()) {
      toast.error('Type a team name, or pick one from the list');
      return;
    }

    const payload = {
      email: values.email,
      name: values.name || undefined,
      role: values.role,
      department:
        values.role === ROLES.SUPER_ADMIN || usingCustomDept
          ? undefined
          : values.department || undefined,
      departmentName:
        values.role === ROLES.SUPER_ADMIN
          ? undefined
          : usingCustomDept
            ? values.departmentName.trim()
            : undefined,
      team:
        values.role === ROLES.SUPER_ADMIN || usingCustomTeam
          ? undefined
          : values.team || undefined,
      teamName:
        values.role === ROLES.SUPER_ADMIN
          ? undefined
          : usingCustomTeam
            ? values.teamName.trim()
            : undefined,
      teamLead: values.role === ROLES.SUPER_ADMIN ? undefined : values.teamLead || undefined,
      setAsTeamLead: values.role === ROLES.SUPER_ADMIN ? false : Boolean(values.setAsTeamLead),
    };

    invite.mutate(payload, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['departments'] });
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        setResult({
          email: values.email,
          name: values.name || data?.user?.name,
          temporaryPassword: data?.temporaryPassword,
          acceptUrl: data?.acceptUrl,
          loginUrl: data?.loginUrl || `${window.location.origin}/login`,
          emailSent: data?.emailSent,
          emailError: data?.emailError,
          emailTo: data?.emailTo || values.email,
          emailFrom: data?.emailFrom || 'BIWORKSPACE',
          emailRedirectedTo: data?.emailRedirectedTo || null,
          emailNote: data?.emailNote || null,
          emailDeliveryStatus: data?.emailDeliveryStatus || null,
          teamId: data?.teamId,
        });
        if (data?.emailSent === false) {
          toast.warning(
            data?.emailError ||
              'Account created but email could not be sent. Share the invite link.'
          );
        } else if (data?.emailRedirectedTo) {
          toast.success(
            `Invite emailed to ${data.emailRedirectedTo} (Resend test mode). Share credentials with ${values.email}.`
          );
        } else {
          toast.success(`Invite email delivered to ${values.email} inbox`);
        }
      },
    });
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select and copy manually');
    }
  };

  const emailInviteWhatsAppText = result
    ? [
        `You're invited to BIWORKSPACE by ${inviterName}.`,
        ``,
        result.acceptUrl ? `Accept invite: ${result.acceptUrl}` : null,
        `Sign in: ${result.loginUrl}`,
        `Email: ${result.email}`,
        result.temporaryPassword ? `Temporary password: ${result.temporaryPassword}` : null,
        ``,
        `Set your password via the accept link (expires in 7 days).`,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const requiresTeam =
    role === ROLES.TEAM_LEAD ||
    selectedRole === ROLES.TEAM_LEAD ||
    selectedRole === ROLES.EXECUTIVE ||
    selectedRole === ROLES.EMPLOYEE;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite to BIWORKSPACE"
      description={
        isSuperAdmin
          ? 'Choose department → assign role → send email. The invitee must open that email to log in.'
          : 'Invite by email. The user receives a BIWORKSPACE message and logs in from their inbox.'
      }
      size="md"
    >
      {!userCanInvite ? (
        <p className="text-sm text-graphite">
          Only Super Admin, Department Head, or Team Lead can invite users.
        </p>
      ) : result ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary-soft bg-primary-soft/30 p-4">
            <p className="text-sm font-medium text-ink">
              {result.emailSent === false
                ? 'Invite created (email not delivered)'
                : 'Email sent from BIWORKSPACE'}
            </p>
            {result.emailSent !== false ? (
              <p className="mt-2 text-sm leading-relaxed text-graphite">
                {result.emailRedirectedTo ? (
                  <>
                    Resend test mode (domain not verified yet): invite email was delivered to{' '}
                    <span className="font-medium text-ink">{result.emailRedirectedTo}</span>.
                    Intended user is{' '}
                    <span className="font-medium text-ink">{result.emailTo || result.email}</span>.
                    Forward that email or share the link/password below. After you verify the domain
                    in Resend, invites will go directly to the user.
                  </>
                ) : (
                  <>
                    Invite email from BIWORKSPACE was sent to{' '}
                    <span className="font-medium text-ink">{result.emailTo || result.email}</span>
                    {result.emailDeliveryStatus ? (
                      <> (status: {result.emailDeliveryStatus})</>
                    ) : null}
                    . They should open that inbox (check spam too), accept the invite, set a
                    password, and sign in.
                  </>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-graphite">
                Credentials for{' '}
                <span className="font-medium text-ink">{result.emailTo || result.email}</span>
                {result.teamId ? ' · added to team' : ''}
              </p>
            )}
            {result.emailNote ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                {result.emailNote}
              </p>
            ) : null}
            {result.emailSent !== false && result.teamId ? (
              <p className="mt-1 text-xs text-graphite">Also added to the selected team.</p>
            ) : null}
            {result.emailSent === false && result.emailError ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                {result.emailError}
              </p>
            ) : null}
            {result.acceptUrl && (
              <p className="mt-3 break-all rounded-md bg-paper px-3 py-2 text-xs text-ink">
                {result.acceptUrl}
              </p>
            )}
            {result.temporaryPassword && (
              <p className="mt-2 rounded-md bg-paper px-3 py-2 font-mono text-sm text-ink">
                Temp password: {result.temporaryPassword}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              onClick={() => window.open(buildWhatsAppUrl(emailInviteWhatsAppText), '_blank')}
            >
              <MessageCircle className="h-4 w-4" />
              Share on WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() =>
                copyText(
                  [
                    result.acceptUrl ? `Accept: ${result.acceptUrl}` : null,
                    `Login: ${result.loginUrl}`,
                    `Email: ${result.email}`,
                    `Password: ${result.temporaryPassword || ''}`,
                  ]
                    .filter(Boolean)
                    .join('\n')
                )
              }
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy credentials
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={resetAll}>
              Invite another
            </Button>
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-graphite">
            {isSuperAdmin
              ? 'As Super Admin, pick the department and the role this person should have. An invite email from BIWORKSPACE is required for them to log in.'
              : 'Pick department and role, then send. The invite email is required for login.'}
          </p>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email (required)</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@company.com"
              {...register('email', { required: 'Email is required — invite is sent here' })}
            />
            {errors.email && <p className="text-sm text-bloom-coral">{errors.email.message}</p>}
            <p className="text-xs text-graphite">
              BIWORKSPACE will email login details to this address.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name">Name (optional)</Label>
            <Input id="invite-name" placeholder="Alex Rivera" {...register('name')} />
          </div>

          {/* 1. Department (optional when inviting Super Admin) */}
          <div className="space-y-2">
            <Label htmlFor="invite-department">
              1. Department{selectedRole === ROLES.SUPER_ADMIN ? '' : ' *'}
            </Label>
            <Select
              id="invite-department"
              {...register('department', {
                required:
                  selectedRole !== ROLES.SUPER_ADMIN && !isCustomDepartment
                    ? 'Department is required'
                    : false,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v !== CUSTOM_VALUE) setValue('departmentName', '');
                  setValue('team', '');
                  setValue('teamName', '');
                },
              })}
            >
              <option value="">
                {selectedRole === ROLES.SUPER_ADMIN
                  ? 'Not required for Super Admin'
                  : 'Select department'}
              </option>
              {mainDepartments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
              {otherDepartments.length > 0 && (
                <optgroup label="Other departments">
                  {otherDepartments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {isSuperAdmin ? <option value={CUSTOM_VALUE}>Add your own…</option> : null}
            </Select>
            {isCustomDepartment && selectedRole !== ROLES.SUPER_ADMIN && (
              <>
                <Input
                  id="invite-departmentName"
                  list="invite-department-suggestions"
                  placeholder="Type department name"
                  {...register('departmentName', {
                    required: 'Type a department name',
                    minLength: { value: 2, message: 'At least 2 characters' },
                  })}
                />
                <datalist id="invite-department-suggestions">
                  {allDepartments.map((d) => (
                    <option key={d._id} value={d.name} />
                  ))}
                </datalist>
              </>
            )}
            <p className="text-xs text-graphite">
              {selectedRole === ROLES.SUPER_ADMIN
                ? 'Super Admin has org-wide access — department is optional'
                : 'SEO · Development · UI/UX Designing'}
            </p>
            {errors.departmentName && (
              <p className="text-sm text-bloom-coral">{errors.departmentName.message}</p>
            )}
          </div>

          {/* 2. Role — Super Admin can also grant Super Admin */}
          <div className="space-y-2">
            <Label htmlFor="invite-role">2. Assign role *</Label>
            <Select
              id="invite-role"
              {...register('role', { required: 'Select a role' })}
              disabled={!isSuperAdmin && !hasDepartment}
            >
              {!isSuperAdmin && !hasDepartment ? (
                <option value="">Select a department first</option>
              ) : rolesForDepartment.length === 0 ? (
                <option value="">No roles available for your account</option>
              ) : (
                rolesForDepartment.map((r) => (
                  <option key={r} value={r}>
                    {r === ROLES.SUPER_ADMIN
                      ? 'Super Admin'
                      : getInviteRoleLabel(selectedDeptCode, r)}
                  </option>
                ))
              )}
            </Select>
            {isSuperAdmin ? (
              <p className="text-xs text-graphite">
                You can grant Super Admin access, or assign department roles
              </p>
            ) : selectedDeptCode === 'seo' ? (
              <p className="text-xs text-graphite">
                SEO roles: SEO Head, Team Lead, Executive, Employee
              </p>
            ) : selectedDeptCode === 'development' ? (
              <p className="text-xs text-graphite">Development roles: Team Lead, Employee</p>
            ) : selectedDeptCode === 'designing' ? (
              <p className="text-xs text-graphite">UI/UX roles: Team Lead, Employee</p>
            ) : hasDepartment ? (
              <p className="text-xs text-graphite">Pick any role you are allowed to assign</p>
            ) : null}
          </div>

          {selectedRole !== ROLES.SUPER_ADMIN && (
          <>
          {/* 3. Team */}
          <div className="space-y-2">
            <Label htmlFor="invite-team">
              3. Team{requiresTeam && selectedRole !== ROLES.DEPT_HEAD ? ' *' : ''}
            </Label>
            <Select
              id="invite-team"
              {...register('team', {
                required:
                  requiresTeam && selectedRole !== ROLES.DEPT_HEAD && !isCustomTeam
                    ? 'Team is required for this role'
                    : false,
                onChange: (e) => {
                  if (e.target.value !== CUSTOM_VALUE) setValue('teamName', '');
                },
              })}
              disabled={!hasDepartment}
            >
              <option value="">
                {selectedRole === ROLES.DEPT_HEAD ? 'Optional team' : 'Select team'}
              </option>
              {teamsInDepartment.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                  {team.lead?.name ? ` · Lead: ${team.lead.name}` : ''}
                </option>
              ))}
              <option value={CUSTOM_VALUE}>Add your own…</option>
            </Select>
            {isCustomTeam && (
              <>
                <Input
                  id="invite-teamName"
                  list="invite-team-suggestions"
                  placeholder="Type team name"
                  {...register('teamName', {
                    required:
                      requiresTeam && selectedRole !== ROLES.DEPT_HEAD
                        ? 'Type a team name'
                        : false,
                    minLength: { value: 2, message: 'At least 2 characters' },
                  })}
                />
                <datalist id="invite-team-suggestions">
                  {teamsInDepartment.map((t) => (
                    <option key={t.name} value={t.name} />
                  ))}
                </datalist>
              </>
            )}
          </div>

          {/* 4. Team Lead */}
          <div className="space-y-2">
            <Label htmlFor="invite-teamLead">4. Team Lead</Label>
            <Select
              id="invite-teamLead"
              {...register('teamLead')}
              disabled={(!selectedTeam || selectedTeam === CUSTOM_VALUE) && selectedRole !== ROLES.TEAM_LEAD}
            >
              <option value="">
                {selectedTeamDoc?.lead?.name
                  ? `Current: ${selectedTeamDoc.lead.name}`
                  : 'Select team lead'}
              </option>
              {teamLeadsInDepartment.map((lead) => (
                <option key={lead._id} value={lead._id}>
                  {lead.name}
                </option>
              ))}
            </Select>
            {selectedRole === ROLES.TEAM_LEAD && (selectedTeam || isCustomTeam) && (
              <label className="mt-2 flex items-center gap-2 text-sm text-graphite">
                <input type="checkbox" {...register('setAsTeamLead')} className="rounded border-hairline" />
                Set invitee as Team Lead of this team
              </label>
            )}
          </div>
          </>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              <UserPlus className="h-4 w-4" />
              <Mail className="h-4 w-4" />
              {invite.isPending ? 'Sending invite email…' : 'Send invite email'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
