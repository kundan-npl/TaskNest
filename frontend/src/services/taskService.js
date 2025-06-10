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

  // Get a single task by ID (updated: requires projectId)
  getTaskById: async (projectId, id) => {
    console.log('[taskService.getTaskById] called with:', { projectId, id, typeofId: typeof id });
    try {
      const response = await api.get(`/projects/${projectId}/tasks/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch task');
    }
  },

  // Fallback: Get a single task by ID only (no projectId)
  getTaskByIdSimple: async (id) => {
    console.log('[taskService.getTaskByIdSimple] called with:', { id, typeofId: typeof id });
    try {
      // Use the new /simple endpoint for mapped fields
      const response = await api.get(`/tasks/${id}/simple`);
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

  // Delete a task (updated: requires projectId)
  deleteTask: async (projectId, id) => {
    try {
      const response = await api.delete(`/projects/${projectId}/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete task');
    }
  },

  // Update task status (updated: requires projectId)
  updateTaskStatus: async (projectId, id, status) => {
    try {
      const response = await api.put(`/projects/${projectId}/tasks/${id}/status`, { status });
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

  // Add comment to task (now uses /tasks/:id/comments)
  addTaskComment: async (id, comment) => {
    try {
      const response = await api.post(`/tasks/${id}/comments`, { content: comment });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add comment');
    }
  },

  // Get task comments (now uses /tasks/:id/comments)
  getTaskComments: async (id) => {
    try {
      const response = await api.get(`/tasks/${id}/comments`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch comments');
    }
  },

  // Get tasks for a specific project
  getProjectTasks: async (projectId, query = {}) => {
    try {
      const params = new URLSearchParams(query).toString();
      const response = await api.get(`/projects/${projectId}/tasks${params ? `?${params}` : ''}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project tasks');
    }
  },

  // Bulk update tasks
  bulkUpdateTasks: async (taskIds, updates) => {
    try {
      const response = await api.put('/tasks/bulk-update', { taskIds, updates });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to bulk update tasks');
    }
  },

  // Bulk delete tasks
  bulkDeleteTasks: async (taskIds) => {
    try {
      const response = await api.delete('/tasks/bulk-delete', { data: { taskIds } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to bulk delete tasks');
    }
  },

  // Move tasks to different status/column
  moveTasksToStatus: async (taskIds, status) => {
    try {
      const response = await api.put('/tasks/move-status', { taskIds, status });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to move tasks');
    }
  },

  // Bulk assign tasks
  bulkAssignTasks: async (taskIds, userId) => {
    try {
      const response = await api.put('/tasks/bulk-assign', { taskIds, userId });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to bulk assign tasks');
    }
  },

  // Get task analytics
  getTaskAnalytics: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks/analytics`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch task analytics');
    }
  },

  // Search tasks
  searchTasks: async (projectId, searchTerm) => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to search tasks');
    }
  },

  // Get task dependencies
  getTaskDependencies: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/dependencies`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch task dependencies');
    }
  },

  // Set task dependencies
  setTaskDependencies: async (taskId, dependencies) => {
    try {
      const response = await api.put(`/tasks/${taskId}/dependencies`, { dependencies });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to set task dependencies');
    }
  },

  // Duplicate task
  duplicateTask: async (taskId) => {
    try {
      const response = await api.post(`/tasks/${taskId}/duplicate`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to duplicate task');
    }
  },

  // Archive completed tasks
  archiveCompletedTasks: async (projectId) => {
    try {
      const response = await api.put(`/projects/${projectId}/tasks/archive-completed`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to archive completed tasks');
    }
  }
};

export default taskService;
