import api from './api';

export const organizationService = {
  getAllOrganizations: async () => {
    const response = await api.get('/organizations');
    return response.data;
  },
  
  getOrganizationById: async (id) => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },

  getOrganizationBranches: async (id) => {
    const response = await api.get(`/organizations/${id}/branches`);
    return response.data;
  }
};
