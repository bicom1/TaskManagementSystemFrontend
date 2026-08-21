import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import { useTeams } from '@/features/teams/hooks/useTeams';

const KIND_META = {
  list: {
    title: 'Create List',
    placeholder: 'e.g. Marketing tasks, Client work',
    icon: '✅',
    workflowTemplate: 'starter',
    /** Projects create-menu “List” → project list (not a Space) */
    persistKind: 'project',
  },
  folder: {
    title: 'Create Folder',
    placeholder: 'e.g. Client work, Q3 campaigns',
    icon: '📁',
    workflowTemplate: 'starter',
    persistKind: 'folder',
  },
  sprint: {
    title: 'Create Sprint Folder',
    placeholder: 'e.g. Sprint 24',
    icon: '🔄',
    workflowTemplate: 'project_management',
    persistKind: 'sprint',
  },
  doc: {
    title: 'Create Doc',
    placeholder: 'e.g. Meeting notes, Spec',
    icon: '📄',
    workflowTemplate: 'starter',
    persistKind: 'doc',
  },
  form: {
    title: 'Create Form',
    placeholder: 'e.g. Intake form, Bug report',
    icon: '📋',
    workflowTemplate: 'starter',
    persistKind: 'form',
  },
  whiteboard: {
    title: 'Create Whiteboard',
    placeholder: 'e.g. Brainstorm board',
    icon: '✏️',
    workflowTemplate: 'starter',
    persistKind: 'whiteboard',
  },
};

/**
 * Quick-create modal for Folder / Sprint / Doc / Form / Whiteboard.
 * Creates a real project (list) with the chosen kind — shows up under All Projects live.
 */
export function QuickCreateKindModal({ open, kind, onClose }) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: teamsData } = useTeams({ limit: 50 });
  const teams = teamsData?.data ?? [];
  const meta = KIND_META[kind] || KIND_META.folder;

  const [name, setName] = useState('');
  const [team, setTeam] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setTeam(teams[0]?._id || '');
  }, [open, kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    if (!team) {
      toast.error('Select a team — projects belong to a team');
      return;
    }

    const iconLetter = (trimmed[0] || 'P').toUpperCase();

    createProject.mutate(
      {
        name: trimmed,
        description: `${meta.title.replace('Create ', '')} created from sidebar`,
        icon: iconLetter,
        kind: meta.persistKind || kind || 'project',
        workflowTemplate: meta.workflowTemplate,
        activeView: 'list',
        team,
      },
      {
        onSuccess: (project) => {
          onClose?.();
          toast.success(`${meta.title.replace('Create ', '')} created`);
          if (project?._id) navigate(`/projects/${project._id}?view=list`);
        },
        onError: (error) => {
          const data = error?.response?.data;
          const details = data?.errors?.map((err) => err.message).filter(Boolean).join(', ');
          toast.error(details || data?.message || 'Failed to create');
        },
      }
    );
  };

  if (!kind || !KIND_META[kind]) return null;

  return (
    <Modal open={open} onClose={onClose} title={meta.title} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="quick-kind-name">Name</Label>
          <Input
            id="quick-kind-name"
            autoFocus
            placeholder={meta.placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {teams.length > 0 ? (
          <div className="space-y-1.5">
            <Label htmlFor="quick-kind-team">Team (required)</Label>
            <select
              id="quick-kind-team"
              className="flex h-10 w-full rounded-md border border-hairline bg-paper px-3 text-sm"
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
            <p className="text-xs text-graphite">Team members will see this in their sidebar.</p>
          </div>
        ) : (
          <p className="text-sm text-graphite">Create a team first, then create projects for it.</p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createProject.isPending || name.trim().length < 2 || !team || teams.length === 0
            }
          >
            {createProject.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
