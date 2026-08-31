import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/features/users/api/userApi';
import { decodeOAuthProfile } from '@/features/auth/googleProfile';
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
      const profile = decodeOAuthProfile(params.get('profile'));

      if (!accessToken) {
        toast.error('Google Sign-In failed — missing token');
        navigate('/login?googleError=missing_token', { replace: true });
        return;
      }

      const baseUser = profile || { name: 'User' };
      setAuth(baseUser, accessToken);

      try {
        const full = await userApi.me({ skipAuthRefresh: true });
        if (cancelled) return;
        setAuth({ ...baseUser, ...full }, accessToken);
      } catch {
        // Profile from OAuth redirect is enough to enter the app; permissions load later.
      }

      if (cancelled) return;
      toast.success(`Welcome${baseUser.name ? `, ${baseUser.name}` : ''}`);
      navigate('/', { replace: true });
    }

    finish().catch(() => {
      if (cancelled) return;
      setStatus('Could not complete Google Sign-In');
      toast.error('Google Sign-In failed. Please try again.');
      navigate('/login?googleError=session', { replace: true });
    });

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
