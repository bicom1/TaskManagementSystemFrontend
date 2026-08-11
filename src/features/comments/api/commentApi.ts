import { axiosClient } from '../../../api/axiosClient';

export interface Comment {
  _id: string;
  task: string;
  author: { _id: string; name: string; avatarUrl: string | null };
  content: string;
  mentions: string[];
  editedAt: string | null;
  createdAt: string;
}

export const commentApi = {
  listByTask: (taskId: string) =>
    axiosClient.get<{ data: Comment[] }>(`/comments/task/${taskId}`).then((r) => r.data.data),

  create: (payload: { taskId: string; content: string; mentions?: string[] }) =>
    axiosClient.post<{ data: Comment }>('/comments', payload).then((r) => r.data.data),

  update: (id: string, content: string) =>
    axiosClient.patch<{ data: Comment }>(`/comments/${id}`, { content }).then((r) => r.data.data),

  remove: (id: string) => axiosClient.delete(`/comments/${id}`),
};
