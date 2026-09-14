import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { departmentApi, type Department } from '../api/departmentApi';

const KEY = 'departments';

function removeDeptFromCaches(queryClient: ReturnType<typeof useQueryClient>, deptId: string) {
  const id = String(deptId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old: unknown) => {
    if (!old) return old;
    if (typeof old === 'object' && old !== null && Array.isArray((old as { data?: unknown }).data)) {
      const typed = old as { data: Array<{ _id: string }>; pagination?: { total?: number } };
      return {
        ...typed,
        data: typed.data.filter((d) => String(d._id) !== id),
        pagination: typed.pagination
          ? {
              ...typed.pagination,
              total: Math.max(0, (typed.pagination.total || 0) - 1),
            }
          : typed.pagination,
      };
    }
    if (Array.isArray(old)) {
      return old.filter((d: { _id: string }) => String(d._id) !== id);
    }
    return old;
  });
  queryClient.removeQueries({ queryKey: [KEY, deptId] });
}

function patchDeptInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  deptId: string,
  patch: Record<string, unknown>
) {
  const id = String(deptId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old: unknown) => {
    if (!old) return old;
    if (typeof old === 'object' && old !== null && Array.isArray((old as { data?: unknown }).data)) {
      const typed = old as { data: Array<{ _id: string }> };
      return {
        ...typed,
        data: typed.data.map((d) => (String(d._id) === id ? { ...d, ...patch } : d)),
      };
    }
    return old;
  });
}

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
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create department');
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => departmentApi.deactivate(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [KEY] });
      removeDeptFromCaches(queryClient, id);
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Department deleted');
    },
    onError: (
      error: { response?: { data?: { message?: string } } },
      _id,
      context?: { previous?: Array<[unknown, unknown]> }
    ) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key as string[], data);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to delete department');
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Department> }) =>
      departmentApi.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [KEY] });
      patchDeptInCaches(queryClient, id, payload as Record<string, unknown>);
      return { previous };
    },
    onSuccess: (data, variables) => {
      if (data) patchDeptInCaches(queryClient, variables.id, data as Record<string, unknown>);
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.id] });
      toast.success('Department updated');
    },
    onError: (
      error: { response?: { data?: { message?: string } } },
      _vars,
      context?: { previous?: Array<[unknown, unknown]> }
    ) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key as string[], data);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to update department');
    },
  });
}
