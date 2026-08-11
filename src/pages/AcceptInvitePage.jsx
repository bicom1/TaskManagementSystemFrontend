import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { userApi } from '@/features/users/api/userApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { BrandLogo } from '@/components/BrandLogo';
import { getRoleLabel } from '@/lib/roles';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', password: '', confirm: '' },
  });

  useEffect(() => {
    if (!token) {
      setError('Missing invite token');
      setLoading(false);
      return;
    }
    userApi
      .previewInvite(token)
      .then((data) => {
        setPreview(data);
        if (data?.name) setValue('name', data.name);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Invite link is invalid or expired');
      })
      .finally(() => setLoading(false));
  }, [token, setValue]);

  const onSubmit = async (values) => {
    if (values.password !== values.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await userApi.acceptInvite({
        token,
        password: values.password,
        name: values.name || undefined,
      });
      toast.success('Invite accepted — you can sign in now');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not accept invite');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="mb-8">
        <BrandLogo size="lg" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-paper p-6 shadow-[var(--shadow-soft-lift)]">
        <h1 className="text-xl font-semibold text-ink">Accept invite</h1>
        {error ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-bloom-coral">{error}</p>
            <Link to="/login" className="text-sm font-medium text-primary">
              Go to login
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-graphite">
              Welcome{preview?.name ? `, ${preview.name}` : ''}. Set a password to activate your
              account
              {preview?.role ? ` as ${getRoleLabel(preview.role)}` : ''}
              {preview?.department?.name ? ` in ${preview.department.name}` : ''}.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accept-email">Email</Label>
                <Input id="accept-email" value={preview?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accept-name">Name</Label>
                <Input
                  id="accept-name"
                  {...register('name', { required: 'Name is required', minLength: 2 })}
                />
                {errors.name && (
                  <p className="text-sm text-bloom-coral">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="accept-password">Password</Label>
                <Input
                  id="accept-password"
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*[0-9]).+$/,
                      message: 'Must include an uppercase letter and a number',
                    },
                  })}
                />
                {errors.password && (
                  <p className="text-sm text-bloom-coral">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="accept-confirm">Confirm password</Label>
                <Input
                  id="accept-confirm"
                  type="password"
                  {...register('confirm', { required: 'Confirm your password' })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Activating…' : 'Activate account'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
