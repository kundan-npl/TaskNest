import { api } from './authService';

const taskService = {
  // Get all tasks
  getAllTasks: async (query = '') => {
    try {
      const response = await api.get(`/tasks${query}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch tasks');
    }
  },

  // Get a single task by ID
  getTaskById: async (id) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch task');
    }
  },

  // Create a new task
  createTask: async (projectId, taskData) => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, taskData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create task');
    }
  },

  // Update a task
  updateTask: async (id, taskData) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update task');
    }
  },

  // Delete a task
  deleteTask: async (id) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete task');
    }
  },

  // Update task status
  updateTaskStatus: async (id, status) => {
    try {
      const response = await api.put(`/tasks/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update task status');
    }
  },

  // Update task priority
  updateTaskPriority: async (id, priority) => {
    try {
      const response = await api.put(`/tasks/${id}/priority`, { priority });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update task priority');
    }
  },

  // Assign task to user
  assignTask: async (taskId, userId) => {
    try {
      const response = await api.put(`/tasks/${taskId}/assign`, { userId });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to assign task');
    }
  },

  // Add comment to task
  addTaskComment: async (taskId, comment) => {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, { content: comment });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add comment');
    }
  },

  // Get task comments
  getTaskComments: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/comments`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch comments');
    }
  }
};

export default taskService;
