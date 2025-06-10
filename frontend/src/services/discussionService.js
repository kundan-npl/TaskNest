// Discussion Service for Project Communication
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const discussionService = {
  // Get all discussions for a project
  getProjectDiscussions: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/discussions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project discussions:', error);
      throw error;
    }
  },

  // Create a new discussion
  createDiscussion: async (projectId, discussionData) => {
    try {
      const response = await api.post(`/projects/${projectId}/discussions`, discussionData);
      return response.data;
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw error;
    }
  },

  // Get a specific discussion by ID
  getDiscussionById: async (projectId, discussionId) => {
    try {
      const response = await api.get(`/projects/${projectId}/discussions/${discussionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching discussion:', error);
      throw error;
    }
  },

  // Update a discussion
  updateDiscussion: async (projectId, discussionId, updateData) => {
    try {
      const response = await api.put(`/projects/${projectId}/discussions/${discussionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating discussion:', error);
      throw error;
    }
  },

  // Delete a discussion
  deleteDiscussion: async (projectId, discussionId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/discussions/${discussionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting discussion:', error);
      throw error;
    }
  },

  // Add a reply to a discussion
  addReply: async (projectId, discussionId, replyData) => {
    try {
      const response = await api.post(`/projects/${projectId}/discussions/${discussionId}/replies`, replyData);
      return response.data;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  },

  // Like/unlike a discussion
  toggleLike: async (projectId, discussionId) => {
    try {
      const response = await api.post(`/projects/${projectId}/discussions/${discussionId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Like/unlike a reply
  toggleReplyLike: async (projectId, discussionId, replyId) => {
    try {
      const response = await api.post(`/projects/${projectId}/discussions/${discussionId}/replies/${replyId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling reply like:', error);
      throw error;
    }
  },

  // Pin/unpin a discussion (for moderators)
  togglePin: async (projectId, discussionId) => {
    try {
      const response = await api.post(`/projects/${projectId}/discussions/${discussionId}/pin`);
      return response.data;
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  },

  // Lock/unlock a discussion (for moderators)
  toggleLock: async (projectId, discussionId) => {
    try {
      const response = await api.post(`/projects/${projectId}/discussions/${discussionId}/lock`);
      return response.data;
    } catch (error) {
      console.error('Error toggling lock:', error);
      throw error;
    }
  },

  // Mark discussion as viewed
  markAsViewed: async (projectId, discussionId) => {
        try {
      const response = await api.post(`/projects/${projectId}/discussions/${discussionId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error marking as viewed:', error);
      throw error;
    }
  }
};

export default discussionService;
