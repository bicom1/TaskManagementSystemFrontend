import { axiosClient } from '../../../api/axiosClient';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAttachment {
  url: string;
  publicId: string;
  fileName: string;
  fileType?: string;
  uploadedAt: string;
}

export interface Task {
  _id: string;
  key: string;
  title: string;
  description?: string;
  project: string;
  parentTask?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: Array<{ _id: string; name: string; avatarUrl: string | null; email: string }>;
  reporter: { _id: string; name: string; avatarUrl: string | null };
  dueDate?: string;
  labels: string[];
  attachments: TaskAttachment[];
  position: number;
}

export type BoardColumns = Record<TaskStatus, Task[]>;

export const taskApi = {
  getBoard: (projectId: string) =>
    axiosClient.get<{ data: BoardColumns }>(`/tasks/board/${projectId}`).then((r) => r.data.data),

  getById: (id: string) =>
    axiosClient.get<{ data: Task }>(`/tasks/${id}`).then((r) => r.data.data),

  getSubtasks: (id: string) =>
    axiosClient.get<{ data: Task[] }>(`/tasks/${id}/subtasks`).then((r) => r.data.data),

  getActivity: (id: string) =>
    axiosClient.get<{ data: unknown[] }>(`/tasks/${id}/activity`).then((r) => r.data.data),

  create: (payload: {
    title: string;
    description?: string;
    project: string;
    parentTask?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignees?: string[];
    dueDate?: string;
    labels?: string[];
  }) => axiosClient.post<{ data: Task }>('/tasks', payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<Task>) =>
    axiosClient.patch<{ data: Task }>(`/tasks/${id}`, payload).then((r) => r.data.data),

  move: (id: string, payload: { status: TaskStatus; position: number }) =>
    axiosClient.patch<{ data: Task }>(`/tasks/${id}/move`, payload).then((r) => r.data.data),

  remove: (id: string) => axiosClient.delete(`/tasks/${id}`),

  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient
      .post<{ data: TaskAttachment[] }>(`/tasks/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },
};
