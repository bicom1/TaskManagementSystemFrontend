import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { departmentApi, type Department } from '../api/departmentApi';

const KEY = 'departments';

export function useDepartments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => departmentApi.list(params),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => departmentApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success('Department created');
    },
    onError: () => toast.error('Failed to create department'),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Department> }) =>
      departmentApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.id] });
      toast.success('Department updated');
    },
  });
}
