import { api } from './authService';

const notificationService = {
  // Get user notifications
  getNotifications: async (query = {}) => {
    try {
      const params = new URLSearchParams(query).toString();
      const response = await api.get(`/notifications${params ? `?${params}` : ''}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch notifications');
    }
  },

  // Get project notifications
  getProjectNotifications: async (projectId, query = {}) => {
    try {
      const params = new URLSearchParams(query).toString();
      const response = await api.get(`/projects/${projectId}/notifications${params ? `?${params}` : ''}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project notifications');
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to mark notification as read');
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to mark all notifications as read');
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete notification');
    }
  },

  // Get notification preferences
  getPreferences: async () => {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch notification preferences');
    }
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update notification preferences');
    }
  },

  // Get project notification preferences
  getProjectPreferences: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/notifications/preferences`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project notification preferences');
    }
  },

  // Update project notification preferences
  updateProjectPreferences: async (projectId, preferences) => {
    try {
      const response = await api.put(`/projects/${projectId}/notifications/preferences`, preferences);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update project notification preferences');
    }
  },

  // Create custom notification
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/notifications', notificationData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create notification');
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch unread count');
    }
  },

  // Subscribe to project notifications
  subscribeToProject: async (projectId) => {
    try {
      const response = await api.post(`/projects/${projectId}/notifications/subscribe`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to subscribe to project notifications');
    }
  },

  // Unsubscribe from project notifications
  unsubscribeFromProject: async (projectId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/notifications/subscribe`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to unsubscribe from project notifications');
    }
  },

  // Snooze notification
  snoozeNotification: async (notificationId, duration) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/snooze`, { duration });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to snooze notification');
    }
  }
};

export default notificationService;
