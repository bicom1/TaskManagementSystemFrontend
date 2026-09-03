import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { DEPARTMENT_CODES } from '@/lib/roles';

export const CREATE_KIND_META = {
  list: {
    title: 'Create List',
    kind: 'list',
    workflowTemplate: 'starter',
    activeView: 'list',
    successLabel: 'List',
  },
  folder: {
    title: 'Create Folder',
    kind: 'folder',
    workflowTemplate: 'starter',
    activeView: 'list',
    successLabel: 'Folder',
  },
  sprint: {
    title: 'Create Sprint folder',
    kind: 'sprint',
    workflowTemplate: 'project_management',
    activeView: 'list',
    successLabel: 'Sprint folder',
  },
};

function isDevelopmentTeam(team) {
  const code = String(team?.department?.code || '').toLowerCase();
  const deptName = String(team?.department?.name || '').toLowerCase();
  const teamName = String(team?.name || '').toLowerCase();
  return (
    code === DEPARTMENT_CODES.DEVELOPMENT ||
    code === 'development' ||
    deptName.includes('develop') ||
    teamName.includes('develop')
  );
}

/** Collect unique developers from Development department teams. */
export function collectDevelopmentDevelopers(teams = []) {
  const byId = new Map();
  for (const team of teams) {
    if (!isDevelopmentTeam(team)) continue;
    const people = [
      ...(team.lead ? [team.lead] : []),
      ...(Array.isArray(team.members) ? team.members : []),
    ];
    for (const person of people) {
      const id = String(person?._id || person || '');
      if (!id || id.length < 12) continue;
      const existing = byId.get(id);
      byId.set(id, {
        _id: id,
        name: person?.name || existing?.name || 'Developer',
        avatarUrl: person?.avatarUrl ?? existing?.avatarUrl ?? null,
        jobTitle: person?.jobTitle || existing?.jobTitle || '',
        email: person?.email || existing?.email || '',
      });
    }
  }
  return [...byId.values()].sort((a, b) =>
    String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' })
  );
}

export function useCreateProjectModal() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: teamsData } = useTeams({ limit: 50 });
  const teams = teamsData?.data ?? [];

  const developers = useMemo(() => collectDevelopmentDevelopers(teams), [teams]);

  const submit = (
    { kind, name, description = '', team, icon, sprintMeta, developer },
    { onDone } = {}
  ) => {
    const meta = CREATE_KIND_META[kind];
    if (!meta) return;

    const trimmed = String(name || '').trim();
    if (trimmed.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!team) {
      toast.error('Select a team — projects belong to a team');
      return;
    }

    const iconLetter = (icon || trimmed[0] || 'P').toString().slice(0, 1).toUpperCase();
    const sprintNote = sprintMeta
      ? `Sprint: ${sprintMeta.startDay}, ${sprintMeta.durationWeeks}w, ${sprintMeta.effort}`
      : '';

    createProject.mutate(
      {
        name: trimmed,
        description: [description.trim(), sprintNote].filter(Boolean).join('\n'),
        icon: iconLetter,
        kind: meta.kind,
        workflowTemplate: meta.workflowTemplate,
        activeView: meta.activeView,
        defaultViews: ['list', 'board'],
        isPrivate: false,
        team,
        ...(developer ? { developer } : {}),
      },
      {
        onSuccess: (project) => {
          onDone?.();
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

  return {
    teams,
    developers,
    submit,
    isPending: createProject.isPending,
  };
}
