import { useEffect, useState } from 'react';
import { ChevronRight, CircleDot, Wand2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useCreateProjectModal } from './createProjectShared';

const COLOR_PRESETS = ['#292524', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

function PrivateToggle({ checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-ink">Make private</p>
        <p className="text-xs text-graphite">Only you and invited members have access</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-steel/30'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}

export function CreateFolderModal({ open, onClose, onUseTemplates }) {
  const { teams, submit, isPending } = useCreateProjectModal();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setIsPrivate(false);
    setColor(COLOR_PRESETS[0]);
    setTeam(teams[0]?._id || '');
  }, [open, teams]);

  const canCreate = name.trim().length >= 2 && Boolean(team);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Folder"
      description="Use Folders to organize your Lists and projects."
      size="md"
      bodyClassName="min-h-[380px]"
    >
      <form
        className="space-y-4 animate-fade-in"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canCreate) return;
          submit({ kind: 'folder', name, description, team, isPrivate }, { onDone: onClose });
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

        <PrivateToggle checked={isPrivate} onChange={setIsPrivate} />

        <div className="flex items-center justify-between gap-2 border-t border-hairline pt-4">
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
