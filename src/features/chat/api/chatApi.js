import { axiosClient } from '../../../api/axiosClient';

export const chatApi = {
  directory: () =>
    axiosClient.get('/chat/directory').then((r) => r.data.data),

  searchPeople: (params) =>
    axiosClient.get('/chat/people', { params }).then((r) => r.data.data),

  listConversations: (params) =>
    axiosClient.get('/chat/conversations', { params }).then((r) => r.data),

  getConversation: (id) =>
    axiosClient.get(`/chat/conversations/${id}`).then((r) => r.data.data),

  listMessages: (id, params) =>
    axiosClient
      .get(`/chat/conversations/${id}/messages`, { params })
      .then((r) => r.data),

  listOlderMessages: (id, before) =>
    axiosClient
      .get(`/chat/conversations/${id}/messages`, {
        params: { before, limit: 40 },
      })
      .then((r) => r.data),

  startDm: (userId) =>
    axiosClient.post('/chat/dm', { userId }).then((r) => r.data.data),

  startTeamChat: (teamId) =>
    axiosClient.post('/chat/team', { teamId }).then((r) => r.data.data),

  startDepartmentChat: (departmentId) =>
    axiosClient.post('/chat/department', { departmentId }).then((r) => r.data.data),

  startTaskChat: (taskId) =>
    axiosClient.post('/chat/task', { taskId }).then((r) => r.data.data),

  
  sendMessage: (conversationId, payload = {}) => {
    const { files, body, mentions, shareLinks } = payload;
    const hasFiles = Array.isArray(files) && files.length > 0;

    if (hasFiles) {
      const form = new FormData();
      form.append('body', body || '');
      form.append('mentions', JSON.stringify(mentions || []));
      form.append('shareLinks', JSON.stringify(shareLinks || []));
      for (const file of files) {
        form.append('files', file);
      }
      return axiosClient
        .post(`/chat/conversations/${conversationId}/messages`, form)
        .then((r) => r.data.data);
    }

    return axiosClient
      .post(`/chat/conversations/${conversationId}/messages`, {
        body: body || '',
        mentions: mentions || [],
        shareLinks: shareLinks || [],
      })
      .then((r) => r.data.data);
  },

  markRead: (conversationId) =>
    axiosClient
      .patch(`/chat/conversations/${conversationId}/read`)
      .then((r) => r.data),
};
