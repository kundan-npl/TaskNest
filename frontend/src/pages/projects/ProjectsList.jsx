import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import { useAuth } from '../../context/AuthContext.jsx';

// Helper functions
const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'on-hold':
      return 'bg-yellow-100 text-yellow-800';
    case 'planning':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const { currentUser, hasRole } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      let query = '';
      const params = new URLSearchParams();
      
      if (filter === 'my-projects') {
        params.append('createdBy', currentUser.id);
      } else if (filter !== 'all') {
        params.append('status', filter);
      }

      if (params.toString()) {
        query = `?${params.toString()}`;
      }
      
      // In production, use real API call
      const data = await projectService.getAllProjects(query);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      
      // For development, use mock data with complete backend structure
      const mockProjects = [
        {
          _id: '1',
          title: 'TaskNest Frontend Development',
          description: 'Develop the UI components for TaskNest project management application including dashboard, project management, task management, and user authentication.',
          priorityLevel: 'High',
          deadline: '2025-06-15T00:00:00.000Z',
          createdAt: '2025-04-10T09:00:00.000Z',
          updatedAt: '2025-05-20T14:30:00.000Z',
          status: 'active',
          createdBy: {
            _id: 'u1',
            name: 'Shobha Sharma',
            email: 'shobha@tasknest.com'
          },
          members: [
            {
              user: {
                _id: 'u1',
                name: 'Shobha Sharma',
                email: 'shobha@tasknest.com',
                department: 'Development',
                jobTitle: 'Project Manager'
              },
              role: 'supervisor',
              joinedAt: '2025-04-10T09:00:00.000Z',
              permissions: {
                canAssignTasks: true,
                canEditProject: true,
                canManageMembers: true,
                canDeleteProject: true,
                canViewReports: true
              }
            }
          ],
          tags: ['react', 'frontend', 'ui', 'vite', 'tailwind'],
          userRole: currentUser?.id === 'u1' ? 'supervisor' : 'team-member',
          userPermissions: currentUser?.id === 'u1' ? ['canAssignTasks', 'canEditProject', 'canManageMembers', 'canDeleteProject', 'canViewReports'] : ['canViewReports'],
          tasks: {
            total: 12,
            completed: 8,
          },
          progress: 67,
          __v: 0
        }
      ];
      
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      // Text search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          project.title?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          (project.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .filter((project) => {
      // Priority filter
      if (priorityFilter !== 'all') {
        return project.priorityLevel === priorityFilter;
      }
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'deadline':
          aValue = new Date(a.deadline);
          bValue = new Date(b.deadline);
          break;
        case 'priorityLevel':
          const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          aValue = priorityOrder[a.priorityLevel] || 0;
          bValue = priorityOrder[b.priorityLevel] || 0;
          break;
        case 'progress':
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await projectService.deleteProject(projectId);
        toast.success('Project deleted successfully');
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track your projects
          </p>
        </div>
        {hasRole(['admin', 'user']) && (
          <div className="mt-4 sm:mt-0">
            <Link
              to="/projects/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Project
            </Link>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Projects</option>
              <option value="my-projects">My Projects</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
          </div>
          
          {/* Sort Options */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="deadline">Deadline</option>
              <option value="title">Title</option>
              <option value="priorityLevel">Priority</option>
              <option value="progress">Progress</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6" : "divide-y divide-gray-200"}>
          {filteredProjects.length === 0 ? (
            <div className={`text-center py-12 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new project.'}
              </p>
              {hasRole(['admin', 'user']) && (
                <div className="mt-6">
                  <Link
                    to="/projects/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Create Project
                  </Link>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} onDelete={handleDeleteProject} />
            ))
          ) : (
            // List View
            filteredProjects.map((project) => (
              <ProjectListItem key={project._id} project={project} onDelete={handleDeleteProject} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Project Card Component for Grid View
const ProjectCard = ({ project, onDelete }) => {
  return (
    <div className="border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 hover:border-primary-300 bg-white">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          <Link to={`/projects/${project._id}`} className="hover:text-primary-600 transition-colors">
            {project.title}
          </Link>
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priorityLevel)}`}>
            {project.priorityLevel}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Due: {formatDate(project.deadline)}</span>
          <span>{project.tasks?.completed || 0}/{project.tasks?.total || 0} tasks</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2 overflow-hidden">
            {(project.members || []).slice(0, 3).map((member, index) => (
              <div
                key={index}
                className="inline-block h-6 w-6 rounded-full bg-primary-100 border-2 border-white text-xs flex items-center justify-center text-primary-700 font-medium"
                title={member.user?.name || 'User'}
              >
                {(member.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            ))}
            {(project.members || []).length > 3 && (
              <div className="inline-block h-6 w-6 rounded-full bg-gray-100 border-2 border-white text-xs flex items-center justify-center text-gray-500 font-medium">
                +{(project.members || []).length - 3}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/projects/${project._id}`}
              className="text-primary-600 hover:text-primary-900 text-sm font-medium"
            >
              View
            </Link>
            {project.userPermissions?.includes('canEditProject') && (
              <Link
                to={`/projects/${project._id}/edit`}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                Edit
              </Link>
            )}
            {project.userPermissions?.includes('canDeleteProject') && (
              <button
                onClick={() => onDelete(project._id)}
                className="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Project List Item Component for List View
const ProjectListItem = ({ project, onDelete }) => {
  return (
    <div className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  <Link to={`/projects/${project._id}`} className="hover:text-primary-600">
                    {project.title}
                  </Link>
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priorityLevel)}`}>
                  {project.priorityLevel}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                {project.description}
              </p>
              <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                <span>Due: {formatDate(project.deadline)}</span>
                <span>{project.tasks?.completed || 0}/{project.tasks?.total || 0} tasks</span>
                <span>{project.progress}% complete</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Progress Bar */}
              <div className="w-32">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Team Members */}
              <div className="flex -space-x-2 overflow-hidden">
                {project.members.slice(0, 3).map((member, index) => (
                  <div
                    key={index}
                    className="inline-block h-8 w-8 rounded-full bg-primary-100 border-2 border-white text-sm flex items-center justify-center text-primary-700 font-medium"
                    title={member.user.name}
                  >
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {project.members.length > 3 && (
                  <div className="inline-block h-8 w-8 rounded-full bg-gray-100 border-2 border-white text-sm flex items-center justify-center text-gray-500 font-medium">
                    +{project.members.length - 3}
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  to={`/projects/${project._id}`}
                  className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                >
                  View
                </Link>
                {project.userPermissions?.includes('canEditProject') && (
                  <Link
                    to={`/projects/${project._id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Edit
                  </Link>
                )}
                {project.userPermissions?.includes('canDeleteProject') && (
                  <button
                    onClick={() => onDelete(project._id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsList;
