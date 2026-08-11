import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../features/auth/api/authApi';
import { userApi } from '../features/users/api/userApi';
import { LoadingScreen } from '../components/ui/Spinner';
import { hasPermission } from '../lib/permissions';

async function hydrateSession(setAuth) {
  const { user: refreshedUser, accessToken } = await authApi.refresh();
  try {
    const full = await userApi.me();
    setAuth({ ...refreshedUser, ...full }, accessToken);
  } catch {
    setAuth(refreshedUser, accessToken);
  }
}

export function ProtectedRoute({ children, allowedRoles, requiredPermission }) {
  const { isAuthenticated, user, setAuth, accessToken } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      // Enrich with permissions if missing
      if (user && !user.permissions && accessToken) {
        userApi
          .me()
          .then((full) => setAuth({ ...user, ...full }, accessToken))
          .catch(() => {});
      }
      setIsBootstrapping(false);
      return;
    }

    hydrateSession(setAuth)
      .catch(() => {})
      .finally(() => setIsBootstrapping(false));
  }, [isAuthenticated, setAuth, user, accessToken]);

  if (isBootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <LoadingScreen />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && user && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}
