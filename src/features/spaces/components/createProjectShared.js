import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateProject } from '@/features/projects/hooks/useProjects';
import { useTeams } from '@/features/teams/hooks/useTeams';

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

export function useCreateProjectModal() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: teamsData } = useTeams({ limit: 50 });
  const teams = teamsData?.data ?? [];

  const submit = ({ kind, name, description = '', team, isPrivate = false, icon, sprintMeta }, { onDone } = {}) => {
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
        isPrivate,
        team,
      },
      {
        onSuccess: (project) => {
          toast.success(`${meta.successLabel} created`);
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
    submit,
    isPending: createProject.isPending,
  };
}
