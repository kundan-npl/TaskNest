import { api } from './authService';

const projectService = {
  // Get all projects
  getAllProjects: async (query = '') => {
    try {
      const response = await api.get(`/projects${query}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch projects');
    }
  },

  // Get a single project by ID
  getProject: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data; // This returns { success: true, data: projectData }
    } catch (error) {
      console.error('Project service error:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch project');
    }
  },

  // Alias for backward compatibility
  getProjectById: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project');
    }
  },

  // Create a new project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create project');
    }
  },

  // Update a project
  updateProject: async (id, projectData) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update project');
    }
  },

  // Delete a project
  deleteProject: async (id) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete project');
    }
  },

  // Get project tasks
  getProjectTasks: async (projectId, query = '') => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks${query}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project tasks');
    }
  },

  // Get project team members
  getProjectMembers: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/members`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project members');
    }
  },

  // Add member to project
  addProjectMember: async (projectId, userId) => {
    try {
      const response = await api.post(`/projects/${projectId}/members`, { userId });
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add member to project');
    }
  },

  // Remove member from project
  removeProjectMember: async (projectId, userId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to remove member from project');
    }
  },

  // Get project milestones
  getProjectMilestones: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/milestones`);
      return response.data;
    } catch (error) {
      console.error('Milestones API not implemented, returning mock data');
      // Return mock milestones for now
      return {
        data: [
          {
            id: '1',
            title: 'Project Kickoff',
            description: 'Initial project setup and team onboarding',
            dueDate: '2024-02-15',
            status: 'completed',
            priority: 'high'
          },
          {
            id: '2',
            title: 'MVP Development',
            description: 'Complete minimum viable product features',
            dueDate: '2024-04-30',
            status: 'inProgress',
            priority: 'high'
          },
          {
            id: '3',
            title: 'Testing & QA',
            description: 'Comprehensive testing and quality assurance',
            dueDate: '2024-06-15',
            status: 'upcoming',
            priority: 'medium'
          }
        ]
      };
    }
  }
};

export default projectService;
