import api from './api';

export const queueService = {
  getQueue: async (queueId) => {
    const response = await api.get(`/queue/${queueId}`);
    return response.data;
  },

  getQueueList: async (params) => {
    const response = await api.get('/queue', { params });
    return response.data;
  },

  callNext: async (queueId) => {
    const response = await api.post(`/queue/${queueId}/next`);
    return response.data;
  },

  startService: async (queueId) => {
    const response = await api.put(`/queue/${queueId}/start`);
    return response.data;
  },

  completeService: async (queueId) => {
    const response = await api.put(`/queue/${queueId}/complete`);
    return response.data;
  },

  markNoShow: async (queueId) => {
    const response = await api.put(`/queue/${queueId}/no-show`);
    return response.data;
  },

  cancelQueue: async (queueId) => {
    const response = await api.put(`/queue/${queueId}/cancel`);
    return response.data;
  },

  processCheckIn: async (checkInToken) => {
    const response = await api.post('/check-in', { check_in_token: checkInToken });
    return response.data;
  }
};
