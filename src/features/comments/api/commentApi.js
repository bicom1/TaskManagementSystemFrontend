import { axiosClient } from '../../../api/axiosClient';

export const commentApi = {
  listByTask: (taskId) =>
    axiosClient.get(`/comments/task/${taskId}`).then((r) => r.data.data),

  /**
   * Create a comment. Pass:
   * - { content, mentions?, links? } for text/links only
   * - { content?, links?, files: File[] } to include uploads (multipart)
   */
  create: ({ taskId, content = '', mentions, links, files }) => {
    const hasFiles = Array.isArray(files) && files.length > 0;

    if (hasFiles) {
      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('content', content || '');
      if (mentions?.length) formData.append('mentions', JSON.stringify(mentions));
      if (links?.length) formData.append('links', JSON.stringify(links));
      files.forEach((file) => formData.append('files', file));
      return axiosClient
        .post('/comments', formData)
        .then((r) => r.data.data);
    }

    return axiosClient
      .post('/comments', {
        taskId,
        content: content || '',
        mentions,
        links,
      })
      .then((r) => r.data.data);
  },

  update: (id, content) =>
    axiosClient.patch(`/comments/${id}`, { content }).then((r) => r.data.data),

  remove: (id) => axiosClient.delete(`/comments/${id}`),
};
