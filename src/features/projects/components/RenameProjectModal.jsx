import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useUpdateProject } from '../hooks/useProjects';

export function RenameProjectModal({ project, open, onClose }) {
  const updateProject = useUpdateProject();
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open || !project) return;
    setName(project.name || '');
  }, [open, project]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!project?._id || !name.trim()) return;

    updateProject.mutate(
      { id: project._id, payload: { name: name.trim() } },
      { onSuccess: () => onClose?.() }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rename project"
      description="Change how this project appears in your sidebar."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rename-project">Name</Label>
          <Input
            id="rename-project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={150}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateProject.isPending || !name.trim()}>
            {updateProject.isPending ? 'Saving…' : 'Update'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
