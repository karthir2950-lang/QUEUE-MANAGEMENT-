import api from './api';

export const adminAnalyticsService = {
  getOverview: async (dateRange = {}) => {
    const response = await api.get('/admin/analytics/overview', { params: dateRange });
    return response.data;
  },

  getAppointmentTrends: async (params) => {
    const response = await api.get('/admin/analytics/appointments', { params });
    return response.data;
  },

  getQueuePerformance: async (dateRange = {}) => {
    const response = await api.get('/admin/analytics/queue-performance', { params: dateRange });
    return response.data;
  },

  getPeakHours: async (dateRange = {}) => {
    const response = await api.get('/admin/analytics/peak-hours', { params: dateRange });
    return response.data;
  },

  getServicePerformance: async (dateRange = {}) => {
    const response = await api.get('/admin/analytics/services', { params: dateRange });
    return response.data;
  },

  getOrganizationPerformance: async (dateRange = {}) => {
    const response = await api.get('/admin/analytics/organizations', { params: dateRange });
    return response.data;
  },

  getBranchPerformance: async (dateRange = {}) => {
    const response = await api.get('/admin/analytics/branches', { params: dateRange });
    return response.data;
  },

  getAIPerformance: async () => {
    const response = await api.get('/admin/analytics/ai-performance');
    return response.data;
  }
};
