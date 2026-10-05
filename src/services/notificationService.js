import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },
  
  markAsRead: async (notifId) => {
    const response = await api.put(`/notifications/${notifId}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};
