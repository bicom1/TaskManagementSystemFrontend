import { useEffect, useState } from 'react';
import { ChevronRight, CircleDot, Wand2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useCreateProjectModal } from './createProjectShared';

const COLOR_PRESETS = ['#292524', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

export function CreateFolderModal({ open, onClose, onUseTemplates }) {
  const { teams, submit, isPending } = useCreateProjectModal();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setColor(COLOR_PRESETS[0]);
    setTeam(teams[0]?._id || '');
  }, [open, teams]);

  const canCreate = name.trim().length >= 2 && Boolean(team);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Folder"
      description="Use folders to organize your lists and related projects."
      size="md"
      variant="premium"
      badge="New folder"
      tone="amber"
    >
      <form
        className="space-y-4 animate-fade-in"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canCreate) return;
          submit({ kind: 'folder', name, description, team }, { onDone: onClose });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="folder-name">Name</Label>
          <div className="flex gap-2">
            <Input
              id="folder-name"
              autoFocus
              placeholder="e.g. Project, Client, Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-hairline p-1"
              aria-label="Folder color"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="folder-desc">Description</Label>
          <Textarea
            id="folder-desc"
            rows={2}
            placeholder="Tell us a bit about your Folder (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="folder-location">Select a Location</Label>
          <select
            id="folder-location"
            className="flex h-10 w-full rounded-lg border border-hairline bg-paper px-3 text-sm"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          >
            <option value="">All Projects</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-hairline">
          <p className="border-b border-hairline px-4 py-2 text-xs font-semibold uppercase tracking-wide text-graphite">
            Settings
          </p>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-cloud"
          >
            <CircleDot className="h-4 w-4 text-graphite" />
            <span className="flex-1">
              <span className="block text-sm font-medium text-ink">Statuses</span>
              <span className="text-xs text-graphite">Use Space statuses</span>
            </span>
            <ChevronRight className="h-4 w-4 text-steel" />
          </button>
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
