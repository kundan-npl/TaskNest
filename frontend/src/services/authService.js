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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on unauthorized response
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service methods
const authService = {
  // Login user
  login: async (email, password) => {
    try {
      console.log('Attempting login to:', `${API_URL}/auth/login`);
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get user data');
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/me', userData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to process request');
    }
  },

  // Social login
  socialLogin: async (provider, token) => {
    try {
      // In a real implementation, this would call a backend endpoint
      // For this example, we're simulating the response
      
      // Mock response for development purposes
      const mockResponse = {
        success: true,
        token: `mock-token-${Date.now()}`,
        user: {
          id: `user-${Date.now()}`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          email: `${provider}-user@example.com`,
          role: 'team-member',
          createdAt: new Date().toISOString()
        }
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return mockResponse;
      
      // Real implementation would be something like:
      // const response = await api.post('/auth/social-login', { provider, token });
      // return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || `${provider} login failed`);
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await api.put(`/auth/resetpassword/${token}`, { password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Password reset failed');
    }
  },
};

export default authService;

// Export the axios instance for use in other services
export { api };
