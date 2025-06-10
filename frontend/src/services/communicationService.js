import { api } from './authService';

const communicationService = {
  // Get project messages
  getProjectMessages: async (projectId, query = {}) => {
    try {
      const params = new URLSearchParams(query).toString();
      const response = await api.get(`/projects/${projectId}/messages${params ? `?${params}` : ''}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch messages');
    }
  },
  
  // Send message
  sendMessage: async (projectId, messageData) => {
    try {
      const response = await api.post(`/projects/${projectId}/messages`, messageData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  },
  
  // Get discussions
  getDiscussions: async (projectId, query = {}) => {
    try {
      const params = new URLSearchParams(query).toString();
      const response = await api.get(`/projects/${projectId}/discussions${params ? `?${params}` : ''}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch discussions');
    }
  },
  
  // Create discussion
  createDiscussion: async (projectId, discussionData) => {
    try {
      const response = await api.post(`/projects/${projectId}/discussions`, discussionData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create discussion');
    }
  },

  // Reply to discussion
  replyToDiscussion: async (projectId, discussionId, replyData) => {
    try {
      const response = await api.post(`/projects/${projectId}/discussions/${discussionId}/replies`, replyData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to reply to discussion');
    }
  },

  // Delete message
  deleteMessage: async (projectId, messageId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete message');
    }
  },

  // Edit message
  editMessage: async (projectId, messageId, content) => {
    try {
      const response = await api.put(`/projects/${projectId}/messages/${messageId}`, { content });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to edit message');
    }
  },
  
  // Add message reaction
  addReaction: async (projectId, messageId, reaction) => {
    try {
      const response = await api.post(`/projects/${projectId}/messages/${messageId}/reactions`, { reaction });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add reaction');
    }
  },

  // Remove message reaction
  removeReaction: async (projectId, messageId, reaction) => {
    try {
      const response = await api.delete(`/projects/${projectId}/messages/${messageId}/reactions/${reaction}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to remove reaction');
    }
  },

  // Pin message
  pinMessage: async (projectId, messageId) => {
    try {
      const response = await api.post(`/projects/${projectId}/messages/${messageId}/pin`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to pin message');
    }
  },

  // Unpin message
  unpinMessage: async (projectId, messageId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/messages/${messageId}/pin`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to unpin message');
    }
  },

  // Get project activity feed
  getActivityFeed: async (projectId, query = {}) => {
    try {
      const params = new URLSearchParams(query).toString();
      const response = await api.get(`/projects/${projectId}/activity${params ? `?${params}` : ''}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch activity feed');
    }
  },

  // Create announcement
  createAnnouncement: async (projectId, announcementData) => {
    try {
      const response = await api.post(`/projects/${projectId}/announcements`, announcementData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create announcement');
    }
  }
};

export default communicationService;
