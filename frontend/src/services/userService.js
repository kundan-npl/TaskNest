import { api } from './authService';

const userService = {
  // Get all users (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch users');
    }
  },

  // Get a single user by ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user');
    }
  },

  // Create a new user (admin only)
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create user');
    }
  },

  // Update a user (admin only)
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  },

  // Delete a user (admin only)
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  },

  // Search users (for member selection in projects)
  searchUsers: async (query = '') => {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return response.data.data;
    } catch (error) {
      // Fallback to getAllUsers if search endpoint doesn't exist
      try {
        const allUsers = await this.getAllUsers();
        if (query) {
          return allUsers.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
          );
        }
        return allUsers;
      } catch (fallbackError) {
        throw new Error(error.response?.data?.error || 'Failed to search users');
      }
    }
  }
};

export default userService;
