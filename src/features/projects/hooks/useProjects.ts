import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectApi, type Project, type ProjectStatus } from '../api/projectApi';

const KEY = 'projects';

export function useProjects(params?: { page?: number; limit?: number; team?: string; status?: ProjectStatus }) {
  return useQuery({ queryKey: [KEY, params], queryFn: () => projectApi.list(params) });
}

export function useProject(id: string) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => projectApi.getById(id), enabled: Boolean(id) });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Project created');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create project');
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Project> }) =>
      projectApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.id] });
    },
  });
}
