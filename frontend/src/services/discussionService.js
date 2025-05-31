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

const DISCUSSION_API_URL = '/discussions';

const discussionService = {
  // Get all discussions for a project
  getProjectDiscussions: async (projectId) => {
    try {
      const response = await api.get(`${DISCUSSION_API_URL}/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project discussions:', error);
      throw error;
    }
  },

  // Create a new discussion
  createDiscussion: async (discussionData) => {
    try {
      const response = await api.post(DISCUSSION_API_URL, discussionData);
      return response.data;
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw error;
    }
  },

  // Get a specific discussion by ID
  getDiscussionById: async (discussionId) => {
    try {
      const response = await api.get(`${DISCUSSION_API_URL}/${discussionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching discussion:', error);
      throw error;
    }
  },

  // Update a discussion
  updateDiscussion: async (discussionId, updateData) => {
    try {
      const response = await api.put(`${DISCUSSION_API_URL}/${discussionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating discussion:', error);
      throw error;
    }
  },

  // Delete a discussion
  deleteDiscussion: async (discussionId) => {
    try {
      const response = await api.delete(`${DISCUSSION_API_URL}/${discussionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting discussion:', error);
      throw error;
    }
  },

  // Add a reply to a discussion
  addReply: async (discussionId, replyData) => {
    try {
      const response = await api.post(`${DISCUSSION_API_URL}/${discussionId}/replies`, replyData);
      return response.data;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  },

  // Like/unlike a discussion
  toggleLike: async (discussionId) => {
    try {
      const response = await api.post(`${DISCUSSION_API_URL}/${discussionId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Like/unlike a reply
  toggleReplyLike: async (discussionId, replyId) => {
    try {
      const response = await api.post(`${DISCUSSION_API_URL}/${discussionId}/replies/${replyId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling reply like:', error);
      throw error;
    }
  },

  // Pin/unpin a discussion (for moderators)
  togglePin: async (discussionId) => {
    try {
      const response = await api.post(`${DISCUSSION_API_URL}/${discussionId}/pin`);
      return response.data;
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  },

  // Lock/unlock a discussion (for moderators)
  toggleLock: async (discussionId) => {
    try {
      const response = await api.post(`${DISCUSSION_API_URL}/${discussionId}/lock`);
      return response.data;
    } catch (error) {
      console.error('Error toggling lock:', error);
      throw error;
    }
  },

  // Mark discussion as viewed
  markAsViewed: async (discussionId) => {
    try {
      const response = await api.post(`${DISCUSSION_API_URL}/${discussionId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error marking as viewed:', error);
      throw error;
    }
  },
  
  // Get all discussions for a project
  getProjectDiscussions: async (projectId) => {
    try {
      const response = await api.get(`${API_URL}/project/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project discussions:', error);
      throw error;
    }
  },

  // Create a new discussion
  createDiscussion: async (discussionData) => {
    try {
      const response = await api.post(API_URL, discussionData);
      return response.data;
    } catch (error) {
      console.error('Error creating discussion:', error);
      throw error;
    }
  },

  // Get a specific discussion by ID
  getDiscussionById: async (discussionId) => {
    try {
      const response = await api.get(`${API_URL}/${discussionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching discussion:', error);
      throw error;
    }
  },

  // Update a discussion
  updateDiscussion: async (discussionId, updateData) => {
    try {
      const response = await api.put(`${API_URL}/${discussionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating discussion:', error);
      throw error;
    }
  },

  // Delete a discussion
  deleteDiscussion: async (discussionId) => {
    try {
      const response = await api.delete(`${API_URL}/${discussionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting discussion:', error);
      throw error;
    }
  },

  // Add a reply to a discussion
  addReply: async (discussionId, replyData) => {
    try {
      const response = await api.post(`${API_URL}/${discussionId}/replies`, replyData);
      return response.data;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  },

  // Like/unlike a discussion
  toggleLike: async (discussionId) => {
    try {
      const response = await api.post(`${API_URL}/${discussionId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  },

  // Like/unlike a reply
  toggleReplyLike: async (discussionId, replyId) => {
    try {
      const response = await api.post(`${API_URL}/${discussionId}/replies/${replyId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error toggling reply like:', error);
      throw error;
    }
  },

  // Pin/unpin a discussion (for moderators)
  togglePin: async (discussionId) => {
    try {
      const response = await api.post(`${API_URL}/${discussionId}/pin`);
      return response.data;
    } catch (error) {
      console.error('Error toggling pin:', error);
      throw error;
    }
  },

  // Lock/unlock a discussion (for moderators)
  toggleLock: async (discussionId) => {
    try {
      const response = await api.post(`${API_URL}/${discussionId}/lock`);
      return response.data;
    } catch (error) {
      console.error('Error toggling lock:', error);
      throw error;
    }
  },

  // Mark discussion as viewed
  markAsViewed: async (discussionId) => {
    try {
      const response = await api.post(`${API_URL}/${discussionId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error marking as viewed:', error);
      throw error;
    }
  }
};

export default discussionService;
