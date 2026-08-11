import { axiosClient } from '../../../api/axiosClient';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  team: { _id: string; name: string };
  owner: { _id: string; name: string; avatarUrl: string | null };
  members: Array<{ _id: string; name: string; avatarUrl: string | null; email: string }>;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const projectApi = {
  list: (params?: { page?: number; limit?: number; team?: string; status?: ProjectStatus }) =>
    axiosClient.get<PaginatedResponse<Project>>('/projects', { params }).then((r) => r.data),

  getById: (id: string) =>
    axiosClient.get<{ data: Project }>(`/projects/${id}`).then((r) => r.data.data),

  create: (payload: {
    name: string;
    key: string;
    description?: string;
    team: string;
    owner: string;
    members?: string[];
    startDate?: string;
    endDate?: string;
  }) => axiosClient.post<{ data: Project }>('/projects', payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Project>) =>
    axiosClient.patch<{ data: Project }>(`/projects/${id}`, payload).then((r) => r.data.data),

  addMember: (id: string, userId: string) =>
    axiosClient.post<{ data: Project }>(`/projects/${id}/members`, { userId }).then((r) => r.data.data),
};
