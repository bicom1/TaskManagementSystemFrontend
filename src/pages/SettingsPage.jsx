import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { getRoleLabel } from '@/lib/roles';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useUpdateMe, useChangePassword } from '@/features/users/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { UserAvatar } from '@/components/UserAvatar';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();

  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      jobTitle: user?.jobTitle || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  useEffect(() => {
    profileForm.reset({
      name: user?.name || '',
      jobTitle: user?.jobTitle || '',
      avatarUrl: user?.avatarUrl || '',
    });
  }, [user, profileForm]);

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSaveProfile = (values) => {
    updateMe.mutate({
      name: values.name,
      jobTitle: values.jobTitle || null,
      avatarUrl: values.avatarUrl || null,
    });
  };

  const onChangePassword = (values) => {
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    changePassword.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      },
      {
        onSuccess: () => passwordForm.reset(),
      }
    );
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 lg:px-8">
      <div className="mb-8">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite">
          Account
        </p>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Workspace preferences and your profile.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update how you appear in this workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar
                  user={user}
                  avatarUrl={profileForm.watch('avatarUrl') || user?.avatarUrl}
                  name={profileForm.watch('name') || user?.name}
                  size="xl"
                  rounded="xl"
                />
                <p className="text-sm text-graphite">
                  Google Sign-In fills this photo automatically. You can also paste an image URL.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...profileForm.register('name', { required: true, minLength: 2 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input id="jobTitle" {...profileForm.register('jobTitle')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input id="avatarUrl" type="url" placeholder="https://…" {...profileForm.register('avatarUrl')} />
              </div>
              <div className="flex justify-between border-t border-hairline pt-3 text-sm">
                <span className="text-graphite">Email</span>
                <span className="font-medium text-ink">{user?.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-graphite">Role</span>
                <span className="font-medium text-ink">{getRoleLabel(user?.role)}</span>
              </div>
              <Button type="submit" disabled={updateMe.isPending}>
                {updateMe.isPending ? 'Saving…' : 'Save profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Require your current password to set a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register('currentPassword', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('newPassword', { required: true, minLength: 8 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('confirmPassword', { required: true })}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-bloom-coral">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>In-app alerts for assignments, comments, and invites</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-graphite">
              You receive inbox notifications for task assignments, status changes, due dates,
              comments, and teammate invites. Email delivery is used when SMTP is configured on the
              server.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Sign out of this device</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => logout.mutate()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
