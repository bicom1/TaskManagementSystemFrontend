import { axiosClient } from '../../../api/axiosClient';

export const commentApi = {
  listByTask: (taskId) =>
    axiosClient.get(`/comments/task/${taskId}`).then((r) => r.data.data),

  create: (payload) =>
    axiosClient.post('/comments', payload).then((r) => r.data.data),

  update: (id, content) =>
    axiosClient.patch(`/comments/${id}`, { content }).then((r) => r.data.data),

  remove: (id) => axiosClient.delete(`/comments/${id}`),
};
