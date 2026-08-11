import { axiosClient } from '../../../api/axiosClient';

export const departmentApi = {
  list: (params) =>
    axiosClient.get('/departments', { params }).then((r) => r.data),

  getById: (id) =>
    axiosClient.get(`/departments/${id}`).then((r) => r.data.data),

  create: (payload) =>
    axiosClient.post('/departments', payload).then((r) => r.data.data),

  update: (id, payload) =>
    axiosClient.patch(`/departments/${id}`, payload).then((r) => r.data.data),

  deactivate: (id) => axiosClient.delete(`/departments/${id}`),
};
