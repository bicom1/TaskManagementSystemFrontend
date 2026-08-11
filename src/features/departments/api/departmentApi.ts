import { axiosClient } from '../../../api/axiosClient';

export interface Department {
  _id: string;
  name: string;
  description?: string;
  head?: { _id: string; name: string; avatarUrl: string | null };
  isActive: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const departmentApi = {
  list: (params?: { page?: number; limit?: number }) =>
    axiosClient
      .get<PaginatedResponse<Department>>('/departments', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    axiosClient.get<{ data: Department }>(`/departments/${id}`).then((r) => r.data.data),

  create: (payload: { name: string; description?: string; head?: string }) =>
    axiosClient.post<{ data: Department }>('/departments', payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<{ name: string; description: string; head: string }>) =>
    axiosClient.patch<{ data: Department }>(`/departments/${id}`, payload).then((r) => r.data.data),

  deactivate: (id: string) => axiosClient.delete(`/departments/${id}`),
};
