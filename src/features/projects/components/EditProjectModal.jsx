import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Modal, ModalFormFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useUpdateProject } from '../hooks/useProjects';
import { PROJECT_STATUS_LABELS } from '../api/projectApi';

const COLOR_PRESETS = ['#292524', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2'];

export function EditProjectModal({
  project,
  open,
  onClose,
  title = 'Edit project',
  description = 'Update project details visible in the sidebar and board.',
}) {
  const updateProject = useUpdateProject();
  const [form, setForm] = useState({ name: '', description: '', color: '#292524', status: 'active' });

  useEffect(() => {
    if (!open || !project) return;
    setForm({
      name: project.name || '',
      description: project.description || '',
      color: project.color || '#292524',
      status: project.status || 'active',
    });
  }, [open, project]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!project?._id || !form.name.trim()) return;

    updateProject.mutate(
      {
        id: project._id,
        payload: {
          name: form.name.trim(),
          description: form.description.trim(),
          color: form.color,
          status: form.status,
        },
      },
      { onSuccess: () => onClose?.() }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      variant="premium"
      badge="Project settings"
      tone="brand"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            maxLength={150}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            maxLength={2000}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="project-status">Status</Label>
          <Select
            id="project-status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="rounded-xl"
          >
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="rounded-xl border border-hairline/80 bg-gradient-to-br from-white to-surface-1/80 p-3">
          <Label>Color</Label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className="h-8 w-8 rounded-xl border-2 transition hover:scale-105"
                style={{
                  backgroundColor: color,
                  borderColor: form.color === color ? '#1a1a1a' : 'transparent',
                }}
                onClick={() => setForm((f) => ({ ...f, color }))}
                aria-label={`Set color ${color}`}
              />
            ))}
            <Input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="h-8 w-12 cursor-pointer rounded-xl p-0.5"
            />
          </div>
        </div>

        <ModalFormFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateProject.isPending || !form.name.trim()} className="gap-2">
            <Pencil className="h-4 w-4" />
            {updateProject.isPending ? 'Saving…' : title.startsWith('Update') ? 'Update' : 'Save changes'}
          </Button>
        </ModalFormFooter>
      </form>
    </Modal>
  );
}
