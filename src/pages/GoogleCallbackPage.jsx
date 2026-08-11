import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/features/users/api/userApi';
import { LoadingScreen } from '@/components/ui/Spinner';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState('Signing you in with Google…');

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const accessToken = params.get('accessToken');
      if (!accessToken) {
        toast.error('Google Sign-In failed — missing token');
        navigate('/login?googleError=missing_token', { replace: true });
        return;
      }

      try {
        setAuth({ name: '…' }, accessToken);
        const user = await userApi.me();
        if (cancelled) return;
        setAuth(user, accessToken);
        toast.success(`Welcome, ${user.name}`);
        navigate('/', { replace: true });
      } catch (err) {
        if (cancelled) return;
        setStatus('Could not complete Google Sign-In');
        toast.error(err?.response?.data?.message ?? 'Google Sign-In failed');
        navigate('/login?googleError=session', { replace: true });
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [params, navigate, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cloud px-4">
      <div className="text-center">
        <LoadingScreen />
        <p className="mt-4 text-sm text-graphite">{status}</p>
      </div>
    </div>
  );
}
