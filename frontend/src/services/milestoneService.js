import { api } from './authService';

const milestoneService = {
  // Get project milestones
  getProjectMilestones: async (projectId, query = {}) => {
    try {
      const params = new URLSearchParams(query).toString();
      const response = await api.get(`/projects/${projectId}/milestones${params ? `?${params}` : ''}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch milestones');
    }
  },

  // Get milestone by ID
  getMilestoneById: async (milestoneId) => {
    try {
      const response = await api.get(`/milestones/${milestoneId}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch milestone');
    }
  },

  // Create milestone
  createMilestone: async (projectId, milestoneData) => {
    try {
      const response = await api.post(`/projects/${projectId}/milestones`, milestoneData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create milestone');
    }
  },

  // Update milestone
  updateMilestone: async (milestoneId, milestoneData) => {
    try {
      const response = await api.put(`/milestones/${milestoneId}`, milestoneData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update milestone');
    }
  },

  // Delete milestone
  deleteMilestone: async (milestoneId) => {
    try {
      const response = await api.delete(`/milestones/${milestoneId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete milestone');
    }
  },

  // Update milestone status
  updateMilestoneStatus: async (milestoneId, status) => {
    try {
      const response = await api.put(`/milestones/${milestoneId}/status`, { status });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update milestone status');
    }
  },

  // Update milestone progress
  updateMilestoneProgress: async (milestoneId, progress) => {
    try {
      const response = await api.put(`/milestones/${milestoneId}/progress`, { progress });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update milestone progress');
    }
  },

  // Link tasks to milestone
  linkTasks: async (milestoneId, taskIds) => {
    try {
      const response = await api.post(`/milestones/${milestoneId}/tasks`, { taskIds });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to link tasks');
    }
  },

  // Unlink tasks from milestone
  unlinkTasks: async (milestoneId, taskIds) => {
    try {
      const response = await api.delete(`/milestones/${milestoneId}/tasks`, { data: { taskIds } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to unlink tasks');
    }
  },

  // Get milestone timeline
  getMilestoneTimeline: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/milestones/timeline`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch timeline');
    }
  },

  // Get milestone analytics
  getMilestoneAnalytics: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/milestones/analytics`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch milestone analytics');
    }
  },

  // Set milestone dependencies
  setDependencies: async (milestoneId, dependencies) => {
    try {
      const response = await api.post(`/milestones/${milestoneId}/dependencies`, { dependencies });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to set dependencies');
    }
  }
};

export default milestoneService;
