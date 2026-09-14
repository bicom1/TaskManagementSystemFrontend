import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { departmentApi } from '../api/departmentApi';

const KEY = 'departments';

function removeDeptFromCaches(queryClient, deptId) {
  const id = String(deptId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old) => {
    if (!old) return old;
    if (Array.isArray(old.data)) {
      return {
        ...old,
        data: old.data.filter((d) => String(d._id) !== id),
        pagination: old.pagination
          ? {
              ...old.pagination,
              total: Math.max(0, (old.pagination.total || 0) - 1),
            }
          : old.pagination,
      };
    }
    if (Array.isArray(old)) {
      return old.filter((d) => String(d._id) !== id);
    }
    return old;
  });
  queryClient.removeQueries({ queryKey: [KEY, deptId] });
}

function patchDeptInCaches(queryClient, deptId, patch) {
  const id = String(deptId);
  queryClient.setQueriesData({ queryKey: [KEY] }, (old) => {
    if (!old) return old;
    if (Array.isArray(old.data)) {
      return {
        ...old,
        data: old.data.map((d) =>
          String(d._id) === id ? { ...d, ...patch } : d
        ),
      };
    }
    return old;
  });
}

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
    onError: (error, _id, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to delete department');
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => departmentApi.update(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: [KEY] });
      const previous = queryClient.getQueriesData({ queryKey: [KEY] });
      patchDeptInCaches(queryClient, id, payload);
      return { previous };
    },
    onSuccess: (data, variables) => {
      if (data) patchDeptInCaches(queryClient, variables.id, data);
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: [KEY, variables.id] });
      toast.success('Department updated');
    },
    onError: (error, _vars, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(error?.response?.data?.message ?? 'Failed to update department');
    },
  });
}
