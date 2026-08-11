import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, ClipboardCheck } from 'lucide-react';
import {
  usePendingApprovals,
  useApproveTaskGlobal,
  useRejectTaskGlobal,
} from '@/features/tasks/hooks/useTasks';
import { APPROVAL_STATUS_LABELS, PRIORITY_LABELS } from '@/features/tasks/api/taskApi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingScreen, EmptyState } from '@/components/ui/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function ApprovalsPage() {
  const { data: pendingTasks = [], isLoading } = usePendingApprovals();
  const approveTask = useApproveTaskGlobal();
  const rejectTask = useRejectTaskGlobal();
  const [rejectModal, setRejectModal] = useState({ open: false, taskId: null });
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (!rejectModal.taskId) return;
    rejectTask.mutate(
      { id: rejectModal.taskId, reason: rejectReason || undefined },
      {
        onSuccess: () => {
          setRejectModal({ open: false, taskId: null });
          setRejectReason('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
          Workflow
        </p>
        <h1 className="page-title">Approvals</h1>
        <p className="page-subtitle">
          {pendingTasks.length > 0
            ? `${pendingTasks.length} task${pendingTasks.length === 1 ? '' : 's'} awaiting your approval`
            : 'No pending task approvals'}
        </p>
      </div>

      {pendingTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="All caught up"
          description="Employee-created tasks will appear here until you approve or reject them."
        />
      ) : (
        <ul className="space-y-3">
          {pendingTasks.map((task) => (
            <li key={task._id}>
              <Card>
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-graphite">{task.key}</p>
                      <Badge variant="warning">{APPROVAL_STATUS_LABELS.pending}</Badge>
                      <Badge variant="secondary">{PRIORITY_LABELS[task.priority] ?? task.priority}</Badge>
                    </div>
                    <p className="mt-1 font-medium text-ink">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-graphite">{task.description}</p>
                    )}
                    <p className="mt-2 text-xs text-graphite">
                      Reported by {task.reporter?.name ?? 'Unknown'}
                      {task.createdAt &&
                        ` · ${formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}`}
                      {task.project?.name && (
                        <>
                          {' · '}
                          <Link to={`/projects/${task.project._id ?? task.project}`} className="text-primary hover:underline">
                            {task.project.name ?? 'Project'}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveTask.mutate({ id: task._id })}
                      disabled={approveTask.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectModal({ open: true, taskId: task._id })}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={rejectModal.open}
        onClose={() => {
          setRejectModal({ open: false, taskId: null });
          setRejectReason('');
        }}
        title="Reject task"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this task is being rejected…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModal({ open: false, taskId: null });
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectTask.isPending}
            >
              {rejectTask.isPending ? 'Rejecting…' : 'Reject task'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
