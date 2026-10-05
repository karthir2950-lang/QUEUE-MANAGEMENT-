import api from './api';

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getStaff: async () => {
    const response = await api.get('/admin/staff');
    return response.data;
  },

  getOrganizations: async () => {
    const response = await api.get('/admin/organizations');
    return response.data;
  },

  getServices: async () => {
    const response = await api.get('/admin/services');
    return response.data;
  },

  getAppointments: async () => {
    const response = await api.get('/admin/appointments');
    return response.data;
  },

  getQueues: async () => {
    const response = await api.get('/admin/queues');
    return response.data;
  },

  exportAppointmentsCSV: async (dateRange = {}) => {
    // Return blob for download
    const response = await api.get('/admin/reports/appointments.csv', {
      params: dateRange,
      responseType: 'blob',
    });
    return response.data;
  }
};
