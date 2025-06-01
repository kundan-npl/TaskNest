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
  },

  // Get tasks for a specific project
  getProjectTasks: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`);
      return response.data.data;
    } catch (error) {
      console.warn('Failed to fetch project tasks from API, using mock data');
      // Mock data as fallback
      return [
        {
          id: 1,
          title: 'Setup Project Structure',
          description: 'Initialize the project with proper folder structure and dependencies',
          status: 'completed',
          priority: 'high',
          assignee: { id: 1, name: 'John Doe', email: 'john@example.com' },
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          title: 'Design Database Schema',
          description: 'Create the database schema for the application',
          status: 'in_progress',
          priority: 'medium',
          assignee: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          title: 'Implement Authentication',
          description: 'Add user authentication and authorization',
          status: 'todo',
          priority: 'high',
          assignee: null,
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
  }
};

export default taskService;
