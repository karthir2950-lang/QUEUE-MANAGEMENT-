import api from './api';

export const appointmentService = {
  getAvailability: async (serviceId, branchId, date) => {
    const response = await api.get('/appointments/availability', {
      params: { service_id: serviceId, branch_id: branchId, date }
    });
    return response.data;
  },

  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  getMyBookings: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/appointments/my', { params });
    return response.data;
  },

  getAllAppointments: async () => {
    const response = await api.get('/appointments');
    return response.data;
  },

  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  cancelAppointment: async (id) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },

  getAppointmentQR: async (id) => {
    const response = await api.get(`/appointments/${id}/qr`);
    return response.data;
  },

  downloadTokenPdf: async (id) => {
    const response = await api.get(`/appointments/${id}/token-pdf`, {
      responseType: 'blob'
    });
    return response;
  }
};
