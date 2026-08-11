import { axiosClient } from '../../../api/axiosClient';

export const taskApi = {
  getBoard: (projectId) =>
    axiosClient.get(`/tasks/board/${projectId}`).then((r) => r.data.data),

  getById: (id) =>
    axiosClient.get(`/tasks/${id}`).then((r) => r.data.data),

  getSubtasks: (id) =>
    axiosClient.get(`/tasks/${id}/subtasks`).then((r) => r.data.data),

  getActivity: (id) =>
    axiosClient.get(`/tasks/${id}/activity`).then((r) => r.data.data),

  create: (payload) =>
    axiosClient.post('/tasks', payload).then((r) => r.data.data),

  update: (id, payload) =>
    axiosClient.patch(`/tasks/${id}`, payload).then((r) => r.data.data),

  move: (id, payload) =>
    axiosClient.patch(`/tasks/${id}/move`, payload).then((r) => r.data.data),

  remove: (id) => axiosClient.delete(`/tasks/${id}`),

  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient
      .post(`/tasks/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },

  getPendingApprovals: () =>
    axiosClient.get('/tasks/approvals/pending').then((r) => r.data.data),

  advance: (id) =>
    axiosClient.patch(`/tasks/${id}/advance`).then((r) => r.data.data),

  /** Prefer dedicated advance route; falls back to PATCH update */
  advanceOrUpdate: async (id, currentStatus) => {
    try {
      return await taskApi.advance(id);
    } catch (err) {
      if (err?.response?.status === 404) {
        return axiosClient
          .patch(`/tasks/${id}`, { advanceWorkflow: true })
          .then((r) => r.data.data)
          .catch(async () => {
            const next = {
              backlog: 'todo',
              todo: 'in_progress',
              in_progress: 'in_review',
              in_review: 'done',
              done: 'done',
            }[currentStatus];
            return axiosClient.patch(`/tasks/${id}`, { status: next }).then((r) => r.data.data);
          });
      }
      throw err;
    }
  },

  approve: (id, payload = {}) =>
    axiosClient.patch(`/tasks/${id}/approve`, payload).then((r) => r.data.data),

  reject: (id, payload = {}) =>
    axiosClient.patch(`/tasks/${id}/reject`, payload).then((r) => r.data.data),
};

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

export const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const APPROVAL_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};
