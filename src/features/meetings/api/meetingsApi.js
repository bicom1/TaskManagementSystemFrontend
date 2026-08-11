import { axiosClient } from '../../../api/axiosClient';

export const meetingsApi = {
  list: () => axiosClient.get('/workspace/meetings').then((r) => r.data.data),
  calendar: () => axiosClient.get('/workspace/meetings/calendar').then((r) => r.data.data),
  ask: (prompt) =>
    axiosClient.post('/workspace/meetings/ask', { prompt }).then((r) => r.data.data),
};
