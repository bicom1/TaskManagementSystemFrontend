import { useEffect, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { useCreateProjectModal } from './createProjectShared';

function PrivateToggle({ checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-cloud/40 px-4 py-3">
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

export function CreateListModal({ open, onClose, onUseTemplates }) {
  const { teams, submit, isPending } = useCreateProjectModal();
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setIsPrivate(false);
    setTeam(teams[0]?._id || '');
  }, [open, teams]);

  const canCreate = name.trim().length >= 2 && Boolean(team);

  return (
    <Modal open={open} onClose={onClose} title="Create List" size="md" bodyClassName="min-h-[320px]">
      <form
        className="space-y-4 animate-fade-in"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canCreate) return;
          submit({ kind: 'list', name, team, isPrivate }, { onDone: onClose });
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
