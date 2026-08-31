import { axiosClient } from '../../../api/axiosClient';

export const meetingsApi = {
  list: () => axiosClient.get('/workspace/meetings').then((r) => r.data.data),
  calendar: () => axiosClient.get('/workspace/meetings/calendar').then((r) => r.data.data),
  ask: (prompt) =>
    axiosClient.post('/workspace/meetings/ask', { prompt }).then((r) => r.data.data),
  create: (payload) =>
    axiosClient.post('/workspace/meetings', payload).then((r) => r.data.data),
  listLocations: () =>
    axiosClient.get('/workspace/locations').then((r) => r.data.data),
  createLocation: (payload) =>
    axiosClient.post('/workspace/locations', payload).then((r) => r.data.data),
};
