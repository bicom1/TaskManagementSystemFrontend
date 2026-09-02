import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal, ModalFormFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDeleteProject } from '../hooks/useProjects';

export function DeleteProjectModal({ project, open, onClose, onDeleted }) {
  const deleteProject = useDeleteProject();

  const handleDelete = () => {
    if (!project?._id) return;
    deleteProject.mutate(project._id, {
      onSuccess: () => {
        onClose?.();
        onDeleted?.(project);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete project?"
      description="This action cannot be undone. All tasks in this project will be archived."
      size="sm"
      variant="premium"
      badge="Permanent action"
      tone="danger"
    >
      <div className="mb-3 flex items-start gap-3 rounded-xl border border-red-200/80 bg-gradient-to-br from-red-50/90 to-white p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            Delete &ldquo;{project?.name || 'this project'}&rdquo;?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-graphite">
            The project will be removed from your sidebar and workspace. Team members will lose access.
          </p>
        </div>
      </div>
      <ModalFormFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteProject.isPending}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {deleteProject.isPending ? 'Deleting…' : 'Delete project'}
        </Button>
      </ModalFormFooter>
    </Modal>
  );
}
