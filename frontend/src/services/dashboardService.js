import { api } from './authService';

const dashboardService = {
  // Dashboard Overview Stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard stats');
    }
  },

  // User-specific dashboard data
  getUserDashboard: async (userId) => {
    try {
      const response = await api.get(`/dashboard/user/${userId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user dashboard');
    }
  },

  // Real-time dashboard updates
  getDashboardUpdates: async (lastUpdateTime) => {
    try {
      const response = await api.get(`/dashboard/updates?since=${lastUpdateTime}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard updates');
    }
  },

  // Activity feed
  getActivityFeed: async (limit = 20, offset = 0) => {
    try {
      const response = await api.get(`/dashboard/activity?limit=${limit}&offset=${offset}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch activity feed');
    }
  },

  // Performance metrics
  getPerformanceMetrics: async (timeRange = '7d') => {
    try {
      const response = await api.get(`/dashboard/metrics?range=${timeRange}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch performance metrics');
    }
  },

  // System health (admin only)
  getSystemHealth: async (currentUser) => {
    // Only call if user is admin
    if (!currentUser || (currentUser.systemRole !== 'admin' && currentUser.role !== 'admin')) {
      return null;
    }
    try {
      const response = await api.get('/dashboard/system-health');
      return response.data.data;
    } catch (error) {
      // Hide 403 errors for non-admins
      if (error.response && error.response.status === 403) {
        return null;
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch system health');
    }
  }
};

export default dashboardService;
