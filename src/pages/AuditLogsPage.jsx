import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { ROLES } from '@/lib/roles';

function useAuditLogs() {
  return useQuery({
    queryKey: ['audit', 'logs'],
    queryFn: () =>
      axiosClient.get('/audit/logs', { params: { limit: 50 } }).then((r) => r.data),
  });
}

function useActivityLogs() {
  return useQuery({
    queryKey: ['audit', 'activity'],
    queryFn: () =>
      axiosClient.get('/audit/activity', { params: { limit: 50 } }).then((r) => r.data),
  });
}

export default function AuditLogsPage() {
  const user = useAuthStore((s) => s.user);
  const allowed =
    user?.role === ROLES.SUPER_ADMIN || hasPermission(user, PERMISSIONS.AUDIT_VIEW);

  const audit = useAuditLogs();
  const activity = useActivityLogs();

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  if (audit.isLoading || activity.isLoading) {
    return <LoadingScreen />;
  }

  const auditRows = audit.data?.data ?? [];
  const activityRows = activity.data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <header>
        <h1 className="page-title text-ink">Audit & activity</h1>
        <p className="mt-1 text-sm text-graphite">
          Super Admin only — API audit trail and workspace activity.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite">
          API audit log
        </h2>
        <div className="overflow-hidden rounded-xl border border-hairline">
          <table className="w-full text-left text-sm">
            <thead className="bg-cloud text-xs uppercase text-graphite">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((row) => (
                <tr key={row._id} className="border-t border-hairline">
                  <td className="px-3 py-2 text-graphite">
                    {row.createdAt
                      ? formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })
                      : '—'}
                  </td>
                  <td className="px-3 py-2">{row.user?.name || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.method}</td>
                  <td className="max-w-[240px] truncate px-3 py-2 font-mono text-xs">
                    {row.route}
                  </td>
                  <td className="px-3 py-2">{row.statusCode}</td>
                </tr>
              ))}
              {!auditRows.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-graphite">
                    No audit entries yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite">
          Activity
        </h2>
        <ul className="divide-y divide-hairline rounded-xl border border-hairline">
          {activityRows.map((row) => (
            <li key={row._id} className="flex items-start gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="text-ink">
                  <span className="font-medium">{row.actor?.name || 'Someone'}</span>{' '}
                  <span className="text-graphite">{row.action}</span>{' '}
                  <span className="text-graphite">{row.entityType}</span>
                </p>
                <p className="text-xs text-graphite">
                  {row.createdAt
                    ? formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })
                    : ''}
                </p>
              </div>
            </li>
          ))}
          {!activityRows.length && (
            <li className="px-4 py-6 text-center text-sm text-graphite">No activity yet</li>
          )}
        </ul>
      </section>
    </div>
  );
}
