import { axiosClient } from '@/api/axiosClient';

export const aiApi = {
  chat: ({ message, messages = [], model = 'max' }) =>
    axiosClient
      .post('/ai/chat', { message, messages, model })
      .then((r) => r.data.data),
};
