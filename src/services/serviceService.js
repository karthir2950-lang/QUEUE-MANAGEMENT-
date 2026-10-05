import api from './api';

export const serviceService = {
  getAllServices: async () => {
    const response = await api.get('/services');
    return response.data;
  }
};
