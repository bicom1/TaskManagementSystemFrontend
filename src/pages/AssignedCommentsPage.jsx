import { useHomeOverview } from '@/features/home/hooks/useHome';
import { formatDistanceToNow } from 'date-fns';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { MessageSquareText } from 'lucide-react';

export default function AssignedCommentsPage() {
  const { data, isLoading } = useHomeOverview();
  const comments = data?.cards?.assigned_comments ?? [];

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
      <h1 className="page-title mb-2 text-ink">Assigned Comments</h1>
      <p className="mb-6 text-sm text-graphite">
        Comments and mentions on your tasks (from MongoDB notifications).
      </p>

      {comments.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No assigned comments"
          description="When teammates comment on your tasks, they appear here."
        />
      ) : (
        <ul className="space-y-3">
          {comments.map((n) => (
            <li key={n._id} className="rounded-xl border border-hairline bg-paper px-4 py-3">
              <p className="text-sm text-ink">{n.message}</p>
              <p className="mt-1 text-xs text-graphite">
                {n.sender?.name || 'Someone'} ·{' '}
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
