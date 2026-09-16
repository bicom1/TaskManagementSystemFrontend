import { axiosClient } from '../../../api/axiosClient';

export const searchApi = {
  search: (q, limit = 8) =>
    axiosClient.get('/search', { params: { q, limit } }).then((r) => r.data.data),
};
