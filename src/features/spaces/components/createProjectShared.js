import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { DEPARTMENT_CODES, resolveDepartmentCode } from '@/lib/roles';

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

function getDepartmentMeta(team) {
  const code = resolveDepartmentCode(team?.department);
  if (code === DEPARTMENT_CODES.SEO) {
    return {
      code,
      label: 'SEO Executive',
      placeholder: 'Select SEO executive',
      emptyText: 'No SEO team members found in this team yet.',
    };
  }
  if (code === DEPARTMENT_CODES.DESIGNING) {
    return {
      code,
      label: 'UI/UX Designer',
      placeholder: 'Select UI/UX designer',
      emptyText: 'No UI/UX team members found in this team yet.',
    };
  }
  return {
    code: DEPARTMENT_CODES.DEVELOPMENT,
    label: 'Developer',
    placeholder: 'Select developer',
    emptyText: 'No developers found in this team yet.',
  };
}

/** Collect unique selectable people from the currently selected team. */
export function collectAssignablePeople(team) {
  const byId = new Map();
  const people = [
    ...(team?.lead ? [team.lead] : []),
    ...(Array.isArray(team?.members) ? team.members : []),
  ];
  for (const person of people) {
    const id = String(person?._id || person || '');
    if (!id || id.length < 12) continue;
    const existing = byId.get(id);
    byId.set(id, {
      _id: id,
      name: person?.name || existing?.name || 'Team member',
      avatarUrl: person?.avatarUrl ?? existing?.avatarUrl ?? null,
      jobTitle: person?.jobTitle || existing?.jobTitle || '',
      email: person?.email || existing?.email || '',
    });
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
  const getTeamById = (teamId) => teams.find((team) => String(team._id) === String(teamId));
  const getAssignableConfig = (teamId) => {
    const selectedTeam = getTeamById(teamId);
    const meta = getDepartmentMeta(selectedTeam);
    return {
      ...meta,
      people: collectAssignablePeople(selectedTeam),
    };
  };

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
    getTeamById,
    getAssignableConfig,
    submit,
    isPending: createProject.isPending,
  };
}
