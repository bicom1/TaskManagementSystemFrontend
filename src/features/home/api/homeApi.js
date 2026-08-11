import { axiosClient } from '../../../api/axiosClient';

export const homeApi = {
  overview: () => axiosClient.get('/home').then((r) => r.data.data),

  myTasks: (view = 'assigned') =>
    axiosClient.get('/home/my-tasks', { params: { view } }).then((r) => r.data.data),

  updatePreferences: (payload) =>
    axiosClient.patch('/home/preferences', payload).then((r) => r.data.data),

  addPersonal: (taskId) =>
    axiosClient.post('/home/personal-list', { taskId }).then((r) => r.data.data),

  removePersonal: (taskId) =>
    axiosClient.delete(`/home/personal-list/${taskId}`).then((r) => r.data.data),

  trackRecent: (payload) =>
    axiosClient.post('/home/recents', payload).then((r) => r.data.data),
};

export const HOME_CARD_LABELS = {
  recents: 'Recents',
  agenda: 'Agenda',
  meetings: 'Meetings',
  my_work: 'My Work',
  assigned_to_me: 'Assigned to me',
  personal_list: 'Personal List',
  assigned_comments: 'Assigned Comments',
  priorities: 'Priorities',
  locations: 'Locations',
  ai_standup: 'AI Standup',
};
