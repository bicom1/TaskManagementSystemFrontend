import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Check, MessageCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { useInviteUser } from '@/features/users/hooks/useUsers';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useAuthStore } from '@/store/authStore';
import {
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

export function InviteModal({
  open,
  onClose,
  defaultTeamId = '',
  defaultDepartmentId = '',
  defaultTeamLeadId = '',
}) {
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
  /** Invite form: SEO · Development · UI/UX Designing only */
  const mainDepartments = useMemo(() => getMainDepartments(allDepartments), [allDepartments]);
  const mainDepartmentIds = useMemo(
    () => new Set(mainDepartments.map((d) => String(d._id))),
    [mainDepartments]
  );
  const teams = useMemo(
    () =>
      (teamsData?.data ?? []).filter((t) =>
        mainDepartmentIds.has(String(t.department?._id || t.department))
      ),
    [teamsData, mainDepartmentIds]
  );

  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  const invitableByActor = useMemo(() => getInvitableRoles(role), [role]);

  /** Inviting from a specific team page — department / team / lead are fixed */
  const isTeamScoped = Boolean(defaultTeamId);
  /** Inviting into a department only — department is fixed */
  const isDeptScoped = Boolean(defaultDepartmentId) && !isTeamScoped;
  const contextLocked = isTeamScoped || isDeptScoped;

  const scopedTeam = useMemo(
    () => (defaultTeamId ? teams.find((t) => String(t._id) === String(defaultTeamId)) : null),
    [teams, defaultTeamId]
  );

  const resolvedDepartmentId = useMemo(() => {
    if (defaultDepartmentId) return String(defaultDepartmentId);
    if (scopedTeam?.department) {
      return String(scopedTeam.department?._id || scopedTeam.department);
    }
    return '';
  }, [defaultDepartmentId, scopedTeam]);

  const resolvedTeamLeadId = useMemo(() => {
    if (defaultTeamLeadId) return String(defaultTeamLeadId);
    if (scopedTeam?.lead?._id) return String(scopedTeam.lead._id);
    return '';
  }, [defaultTeamLeadId, scopedTeam]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      name: '',
      department: resolvedDepartmentId || '',
      departmentName: '',
      role: ROLES.MEMBER,
      team: defaultTeamId || '',
      teamName: '',
      teamLead: resolvedTeamLeadId || '',
      setAsTeamLead: false,
    },
  });

  const selectedDepartment = watch('department');
  const selectedRole = watch('role');

  const selectedDeptDoc = useMemo(() => {
    return (
      mainDepartments.find((d) => String(d._id) === String(selectedDepartment)) ||
      allDepartments.find((d) => String(d._id) === String(selectedDepartment))
    );
  }, [mainDepartments, allDepartments, selectedDepartment]);

  const selectedDeptCode = resolveDepartmentCode(selectedDeptDoc);
  const hasDepartment = Boolean(selectedDepartment);

  const rolesForInvite = useMemo(() => {
    if (isSuperAdmin) {
      return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MEMBER];
    }
    const allowed = [ROLES.ADMIN, ROLES.MEMBER];
    if (!hasDepartment) return allowed.filter((r) => invitableByActor.includes(r));
    if (!selectedDeptCode) {
      return invitableByActor.filter((r) => allowed.includes(r));
    }
    return getInvitableRolesForDepartment(role, selectedDeptCode, invitableByActor).filter((r) =>
      allowed.includes(r)
    );
  }, [hasDepartment, selectedDeptCode, isSuperAdmin, role, invitableByActor]);

  const isInvitingSuperAdmin = selectedRole === ROLES.SUPERADMIN || selectedRole === ROLES.SUPER_ADMIN;

  useEffect(() => {
    if (!open) return;
    const defaultRole = invitableByActor.includes(ROLES.MEMBER)
      ? ROLES.MEMBER
      : invitableByActor[0] || ROLES.MEMBER;
    reset({
      email: '',
      name: '',
      department: resolvedDepartmentId || '',
      departmentName: '',
      role: defaultRole,
      team: defaultTeamId || '',
      teamName: '',
      teamLead: resolvedTeamLeadId || '',
      setAsTeamLead: false,
    });
    setResult(null);
  }, [
    open,
    defaultTeamId,
    resolvedDepartmentId,
    resolvedTeamLeadId,
    reset,
    invitableByActor,
  ]);

  // Keep scoped values locked even after teams finish loading
  useEffect(() => {
    if (!open || !contextLocked) return;
    if (resolvedDepartmentId) setValue('department', resolvedDepartmentId);
    if (defaultTeamId) setValue('team', String(defaultTeamId));
    if (resolvedTeamLeadId) setValue('teamLead', resolvedTeamLeadId);
  }, [
    open,
    contextLocked,
    resolvedDepartmentId,
    defaultTeamId,
    resolvedTeamLeadId,
    setValue,
    teams,
  ]);

  useEffect(() => {
    if (contextLocked) return;
    // Clear typed team when department changes so names stay in the right dept
    setValue('team', '');
    setValue('teamLead', '');
  }, [contextLocked, selectedDepartment, setValue]);

  useEffect(() => {
    if (!rolesForInvite.length) return;
    if (!rolesForInvite.includes(selectedRole)) {
      setValue('role', rolesForInvite.includes(ROLES.MEMBER) ? ROLES.MEMBER : rolesForInvite[0]);
    }
  }, [rolesForInvite, selectedRole, setValue]);

  // When inviting from a team page, prefill the locked team name
  useEffect(() => {
    if (!isTeamScoped || !scopedTeam?.name) return;
    setValue('teamName', scopedTeam.name);
  }, [isTeamScoped, scopedTeam, setValue]);

  const resetAll = () => {
    reset({
      email: '',
      name: '',
      department: resolvedDepartmentId || '',
      departmentName: '',
      role: ROLES.MEMBER,
      team: defaultTeamId || '',
      teamName: '',
      teamLead: resolvedTeamLeadId || '',
      setAsTeamLead: false,
    });
    setResult(null);
    setCopied(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const onSubmit = (values) => {
    const invitingSa =
      values.role === ROLES.SUPERADMIN || values.role === ROLES.SUPER_ADMIN;

    if (
      !values.role ||
      ![ROLES.SUPERADMIN, ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MEMBER].includes(values.role)
    ) {
      toast.error('Choose Superadmin, Admin, or Member');
      return;
    }

    if (!invitingSa && !values.department) {
      toast.error('Select a department (SEO, Development, or UI/UX)');
      return;
    }

    const typedTeam = String(values.teamName || '').trim();
    if (!invitingSa && !isTeamScoped && !typedTeam) {
      toast.error('Type a team name');
      return;
    }

    const payload = {
      email: values.email,
      name: values.name.trim(),
      role: values.role,
      department: invitingSa
        ? undefined
        : (isTeamScoped || isDeptScoped
            ? resolvedDepartmentId || values.department
            : values.department) || undefined,
      team: invitingSa ? undefined : isTeamScoped ? defaultTeamId || undefined : undefined,
      teamName: invitingSa || isTeamScoped ? undefined : typedTeam,
      teamLead: invitingSa
        ? undefined
        : isTeamScoped
          ? resolvedTeamLeadId || undefined
          : undefined,
      setAsTeamLead: false,
    };

    invite.mutate(payload, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['departments'] });
        queryClient.invalidateQueries({ queryKey: ['teams'] });
        setResult({
          email: values.email,
          name: values.name || data?.user?.name,
          inviteToken: data?.inviteToken,
          acceptUrl:
            data?.inviteToken
              ? `${window.location.origin}/accept-invite?token=${data.inviteToken}`
              : data?.acceptUrl,
          loginUrl: data?.loginUrl || `${window.location.origin}/login`,
          emailSent: data?.emailSent,
          emailError: data?.emailError,
          emailTo: data?.emailTo || values.email,
          emailFrom: data?.emailFrom || 'BIWORKSPACE',
          emailProvider: data?.emailProvider || null,
          emailMessageId: data?.emailMessageId || null,
          emailRedirectedTo: data?.emailRedirectedTo || null,
          emailNote: data?.emailNote || null,
          emailDeliveryStatus: data?.emailDeliveryStatus || null,
          teamId: data?.teamId,
        });
        if (data?.emailSent) {
          toast.success(
            data?.emailRedirectedTo
              ? `Invite emailed to ${data.emailRedirectedTo} (Resend test mode). Share the Google sign-in link with ${values.email}.`
              : 'Invite created and email sent from BIWORKSPACE'
          );
        } else {
          toast.success('Invite ready — share the link below (email may still be catching up)');
        }
      },
    });
  };

  const copyText = async (text, kind = 'credentials') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(kind === 'link' ? 'Invite link copied' : 'Copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Could not copy — select and copy manually');
    }
  };

  const emailInviteWhatsAppText = result
    ? [
        `You're invited to BIWORKSPACE by ${inviterName}.`,
        ``,
        result.acceptUrl ? `Accept invite & sign in with Google: ${result.acceptUrl}` : null,
        `Or open login → Continue with Google: ${result.loginUrl}`,
        `Google email must be: ${result.email}`,
        ``,
        `Invited accounts sign in with Google only (no password). Link expires in 7 days.`,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite to BIWORKSPACE"
      description="Create an invite, then share the direct link on WhatsApp. Email is sent in the background."
      size="md"
    >
      {!userCanInvite ? (
        <p className="text-sm text-graphite">
          Only Superadmin or Admin can invite users.
        </p>
      ) : result ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary-soft bg-primary-soft/30 p-4">
            <p className="text-sm font-medium text-ink">Invite ready for {result.name || result.email}</p>
            <p className="mt-2 text-sm leading-relaxed text-graphite">
              Send them this invite link. They open it and tap{' '}
              <span className="font-medium text-ink">Continue with Google</span> using{' '}
              <span className="font-medium text-ink">{result.emailTo || result.email}</span>.
              {result.teamId ? ' They were also added to the selected team.' : ''}
            </p>
            {result.emailNote ? (
              <p className="mt-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-900">
                {result.emailNote}
              </p>
            ) : null}
            {result.acceptUrl && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-graphite">
                  Direct invite link
                </p>
                <div className="flex items-stretch gap-2">
                  <a
                    href={result.acceptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 break-all rounded-md border border-hairline bg-paper px-3 py-2 text-sm font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:bg-cloud hover:decoration-primary"
                  >
                    {result.acceptUrl}
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto shrink-0 px-3"
                    title="Copy invite link"
                    onClick={() => copyText(result.acceptUrl, 'link')}
                  >
                    {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied === 'link' ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-graphite">
                  Open this link → Continue with Google as{' '}
                  <span className="font-medium text-ink">{result.emailTo || result.email}</span>.
                  Password login will not work for invited members.
                </p>
              </div>
            )}
            <p className="mt-2 text-xs text-graphite">
              Google email:{' '}
              <span className="font-medium text-ink">{result.emailTo || result.email}</span>
            </p>
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
                    result.acceptUrl
                      ? `Accept & Google sign-in: ${result.acceptUrl}`
                      : null,
                    `Login → Continue with Google: ${result.loginUrl}`,
                    `Google email: ${result.email}`,
                  ]
                    .filter(Boolean)
                    .join('\n'),
                  'credentials'
                )
              }
            >
              {copied === 'credentials' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy invite details
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
            {isTeamScoped
              ? `Inviting into ${scopedTeam?.name || 'this team'}. Department and team are set and can’t be changed.`
              : isDeptScoped
                ? 'Inviting into this department. Department is set and can’t be changed.'
                : 'Choose role (Superadmin, Admin, or Member), department, and type a team name. Invitees sign in with Google.'}
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
              BIWORKSPACE will email an invite. They must sign in with Google using this address.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-name">Name *</Label>
            <Input
              id="invite-name"
              placeholder="Alex Rivera"
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            {errors.name && <p className="text-sm text-bloom-coral">{errors.name.message}</p>}
          </div>

          {/* 1. Role — Superadmin / Admin / Member (no dropdown) */}
          <div className="space-y-2">
            <Label>1. Assign role *</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {rolesForInvite.map((r) => {
                const active = selectedRole === r;
                const label =
                  r === ROLES.SUPERADMIN || r === ROLES.SUPER_ADMIN
                    ? 'Superadmin'
                    : r === ROLES.ADMIN
                      ? 'Admin'
                      : 'Member';
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue('role', r, { shouldValidate: true })}
                    className={
                      active
                        ? 'rounded-lg border border-primary bg-primary-soft/40 px-3 py-2.5 text-sm font-semibold text-ink'
                        : 'rounded-lg border border-hairline bg-paper px-3 py-2.5 text-sm font-medium text-graphite hover:border-primary/40 hover:text-ink'
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('role', { required: 'Choose a role' })} />
            <p className="text-xs text-graphite">
              {isInvitingSuperAdmin
                ? 'Superadmin has org-wide access — department and team are not required.'
                : 'Invitees sign in with Google using the invited email.'}
            </p>
          </div>

          {/* 2. Department — SEO · Development · UI/UX only */}
          {!isInvitingSuperAdmin && (
            <div className="space-y-2">
              <Label>2. Department *</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {mainDepartments.map((dept) => {
                  const active = String(selectedDepartment) === String(dept._id);
                  return (
                    <button
                      key={dept._id}
                      type="button"
                      disabled={isTeamScoped || isDeptScoped}
                      onClick={() => {
                        if (contextLocked) return;
                        setValue('department', dept._id, { shouldValidate: true });
                        setValue('departmentName', '');
                        setValue('team', '');
                        setValue('teamName', '');
                      }}
                      className={
                        active
                          ? 'rounded-lg border border-primary bg-primary-soft/40 px-3 py-2.5 text-sm font-semibold text-ink'
                          : 'rounded-lg border border-hairline bg-paper px-3 py-2.5 text-sm font-medium text-graphite hover:border-primary/40 hover:text-ink disabled:opacity-60'
                      }
                    >
                      {dept.name}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register('department', { required: !isInvitingSuperAdmin })} />
              <p className="text-xs text-graphite">SEO · Development · UI/UX Designing</p>
              {errors.department && (
                <p className="text-sm text-bloom-coral">{errors.department.message}</p>
              )}
            </div>
          )}

          {/* 3. Team — type name only (no dropdown) */}
          {!isInvitingSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="invite-teamName">3. Team *</Label>
              {isTeamScoped ? (
                <>
                  <Input
                    id="invite-teamName"
                    value={scopedTeam?.name || 'This team'}
                    disabled
                  />
                  <p className="text-xs text-graphite">Locked to this team</p>
                </>
              ) : (
                <>
                  <Input
                    id="invite-teamName"
                    placeholder="Type team name"
                    disabled={!hasDepartment}
                    autoComplete="off"
                    {...register('teamName', {
                      required: !isInvitingSuperAdmin ? 'Type a team name' : false,
                      minLength: { value: 2, message: 'At least 2 characters' },
                    })}
                  />
                  <p className="text-xs text-graphite">
                    Type the team name. Superadmin can create a new team by typing a new name.
                  </p>
                  {errors.teamName && (
                    <p className="text-sm text-bloom-coral">{errors.teamName.message}</p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              <UserPlus className="h-4 w-4" />
              {invite.isPending ? 'Creating invite…' : 'Create invite & get link'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
