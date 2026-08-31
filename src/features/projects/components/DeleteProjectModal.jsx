import { Modal } from '@/components/ui/Modal';
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
      description={`This permanently removes "${project?.name || 'this project'}" and archives its tasks. This cannot be undone.`}
      size="sm"
    >
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteProject.isPending}
        >
          {deleteProject.isPending ? 'Deleting…' : 'Delete project'}
        </Button>
      </div>
    </Modal>
  );
}
