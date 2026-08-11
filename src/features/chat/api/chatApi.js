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

  sendMessage: (conversationId, payload) =>
    axiosClient
      .post(`/chat/conversations/${conversationId}/messages`, payload)
      .then((r) => r.data.data),

  markRead: (conversationId) =>
    axiosClient
      .patch(`/chat/conversations/${conversationId}/read`)
      .then((r) => r.data),
};
