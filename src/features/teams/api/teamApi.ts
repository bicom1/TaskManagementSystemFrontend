import { axiosClient } from '../../../api/axiosClient';

export interface Team {
  _id: string;
  name: string;
  description?: string;
  department: { _id: string; name: string };
  lead: { _id: string; name: string; avatarUrl: string | null };
  members: Array<{ _id: string; name: string; avatarUrl: string | null; email: string }>;
  isActive: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const teamApi = {
  list: (params?: { page?: number; limit?: number; department?: string }) =>
    axiosClient.get<PaginatedResponse<Team>>('/teams', { params }).then((r) => r.data),

  getById: (id: string) =>
    axiosClient.get<{ data: Team }>(`/teams/${id}`).then((r) => r.data.data),

  create: (payload: { name: string; description?: string; department: string; lead: string; members?: string[] }) =>
    axiosClient.post<{ data: Team }>('/teams', payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Team>) =>
    axiosClient.patch<{ data: Team }>(`/teams/${id}`, payload).then((r) => r.data.data),

  addMember: (id: string, userId: string) =>
    axiosClient.post<{ data: Team }>(`/teams/${id}/members`, { userId }).then((r) => r.data.data),

  removeMember: (id: string, userId: string) =>
    axiosClient.delete<{ data: Team }>(`/teams/${id}/members/${userId}`).then((r) => r.data.data),
};
