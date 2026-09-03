import { useEffect, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateProjectModal } from './createProjectShared';

export function CreateListModal({ open, onClose, onUseTemplates }) {
  const { teams, submit, isPending } = useCreateProjectModal();
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setTeam(teams[0]?._id || '');
  }, [open, teams]);

  const canCreate = name.trim().length >= 2 && Boolean(team);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create List"
      description="Track tasks, projects, and people in a focused list workspace."
      size="md"
      variant="premium"
      badge="New list"
      tone="brand"
    >
      <form
        className="space-y-4 animate-fade-in"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canCreate) return;
          submit({ kind: 'list', name, team }, { onDone: onClose });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="list-name">
            Name <span className="text-danger-text">*</span>
          </Label>
          <Input
            id="list-name"
            autoFocus
            placeholder="Your list or project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="list-location">Space (location)</Label>
          <select
            id="list-location"
            className="flex h-10 w-full rounded-lg border border-hairline bg-paper px-3 text-sm"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          >
            <option value="">All Projects — select team</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-hairline/80 pt-4">
          <Button type="button" variant="ghost" className="gap-2" onClick={onUseTemplates}>
            <Wand2 className="h-4 w-4" />
            Use Templates
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canCreate || isPending}>
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
