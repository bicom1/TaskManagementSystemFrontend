import { useEffect, useState } from 'react';
import { Bot, ChevronRight, Info, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateProjectModal } from './createProjectShared';

const START_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EFFORT_OPTIONS = ['Sprint points', 'Hours', 'Tasks'];

export function CreateSprintFolderModal({ open, onClose }) {
  const { teams, submit, isPending } = useCreateProjectModal();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Sprint Folder');
  const [effort, setEffort] = useState('Sprint points');
  const [startDay, setStartDay] = useState('Monday');
  const [durationWeeks, setDurationWeeks] = useState(2);
  const [team, setTeam] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName('Sprint Folder');
    setEffort('Sprint points');
    setStartDay('Monday');
    setDurationWeeks(2);
    setTeam(teams[0]?._id || '');
  }, [open, teams]);

  const canContinue = name.trim().length >= 2 && Boolean(team);

  const handleCreate = () => {
    if (!canContinue) return;
    submit({
      kind: 'sprint',
      name,
      team,
      sprintMeta: { effort, startDay, durationWeeks },
    }, { onDone: onClose });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 1 ? 'Create Sprint folder' : 'Review Sprint folder'}
      description={
        step === 1
          ? 'Sprint folders help keep your Sprints organized and let you manage Sprint-specific settings.'
          : 'Confirm settings before creating your sprint folder.'
      }
      size="md"
      bodyClassName="min-h-[420px]"
    >
      {step === 1 ? (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label htmlFor="sprint-name">Folder Name</Label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sprint-effort">Measure of effort</Label>
              <select
                id="sprint-effort"
                className="flex h-10 w-full rounded-lg border border-hairline bg-paper px-3 text-sm"
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
              >
                {EFFORT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-team">Team</Label>
              <select
                id="sprint-team"
                className="flex h-10 w-full rounded-lg border border-hairline bg-paper px-3 text-sm"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sprint-start">Sprint start day</Label>
              <select
                id="sprint-start"
                className="flex h-10 w-full rounded-lg border border-hairline bg-paper px-3 text-sm"
                value={startDay}
                onChange={(e) => setStartDay(e.target.value)}
              >
                {START_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-duration">Sprint duration (weeks)</Label>
              <Input
                id="sprint-duration"
                type="number"
                min={1}
                max={8}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Number(e.target.value) || 2)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-hairline">
            <p className="border-b border-hairline px-4 py-2 text-xs font-semibold uppercase tracking-wide text-graphite">
              Settings
            </p>
            <button type="button" className="flex w-full items-center gap-3 border-b border-hairline px-4 py-3 text-left hover:bg-cloud">
              <Bot className="h-4 w-4 text-graphite" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-ink">Automate Sprints</span>
                <span className="text-xs text-graphite">When Sprint ends then Mark Sprint as done…</span>
              </span>
              <ChevronRight className="h-4 w-4 text-steel" />
            </button>
            <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-cloud">
              <RefreshCw className="h-4 w-4 text-graphite" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-ink">Sprint settings</span>
                <span className="text-xs text-graphite">Format, Timezone, Start date, Start time…</span>
              </span>
              <ChevronRight className="h-4 w-4 text-steel" />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-hairline pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-graphite">
              <Info className="h-3.5 w-3.5" />
              Learn more about Sprints
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" disabled={!canContinue} onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-scale-in">
          <div className="rounded-xl border border-hairline bg-cloud/50 p-4 text-sm">
            <p className="font-semibold text-ink">{name}</p>
            <ul className="mt-2 space-y-1 text-graphite">
              <li>Effort: {effort}</li>
              <li>Starts: {startDay}</li>
              <li>Duration: {durationWeeks} week{durationWeeks === 1 ? '' : 's'}</li>
              <li>Team: {teams.find((t) => t._id === team)?.name || '—'}</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2 border-t border-hairline pt-4">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" disabled={isPending} onClick={handleCreate}>
              {isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
