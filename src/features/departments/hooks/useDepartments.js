import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { departmentApi } from '../api/departmentApi';

const KEY = 'departments';

export function useDepartments(params) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => departmentApi.list(params),
  });
}

export function useDepartment(id) {
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
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create department');
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => departmentApi.deactivate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Department deleted');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to delete department');
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => departmentApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.id] });
      toast.success('Department updated');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? 'Failed to update department');
    },
  });
}
