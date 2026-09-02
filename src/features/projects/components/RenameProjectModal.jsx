import { useEffect, useState } from 'react';
import { Type } from 'lucide-react';
import { Modal, ModalFormFooter } from '@/components/ui/Modal';
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
      description="Change how this project appears in your sidebar and across the workspace."
      size="sm"
      variant="premium"
      badge="Quick edit"
      tone="brand"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-hairline/80 bg-gradient-to-br from-white to-surface-1/80 p-3">
          <div className="space-y-1.5">
            <Label htmlFor="rename-project">Project name</Label>
            <Input
              id="rename-project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={150}
              autoFocus
              className="rounded-xl"
              placeholder="Enter a new name"
            />
          </div>
        </div>
        <ModalFormFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateProject.isPending || !name.trim()} className="gap-2">
            <Type className="h-4 w-4" />
            {updateProject.isPending ? 'Saving…' : 'Update'}
          </Button>
        </ModalFormFooter>
      </form>
    </Modal>
  );
}
