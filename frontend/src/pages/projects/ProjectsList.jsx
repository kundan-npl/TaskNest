import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import { useAuth } from '../../context/AuthContext.jsx';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser, hasRole } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let query = '';
      
      if (filter === 'my-projects') {
        query = '?myProjects=true';
      } else if (filter === 'active') {
        query = '?status=active';
      } else if (filter === 'completed') {
        query = '?status=completed';
      }
      
      const data = await projectService.getAllProjects(query);

      // For now, let's use mock data
      const mockProjects = [
        {
          id: '1',
          name: 'TaskNest Frontend Development',
          description: 'Develop the UI components for TaskNest project management application',
          status: 'active',
          priority: 'high',
          progress: 65,
          dueDate: '2025-06-15',
          createdAt: '2025-04-10',
          tasks: {
            total: 18,
            completed: 12,
          },
          members: [
            { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' },
            { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' },
          ],
          manager: { id: '3', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=3' }
        },
        {
          id: '2',
          name: 'TaskNest Backend API',
          description: 'Implement REST API endpoints for the TaskNest application',
          status: 'active',
          priority: 'high',
          progress: 40,
          dueDate: '2025-06-01',
          createdAt: '2025-04-05',
          tasks: {
            total: 15,
            completed: 6,
          },
          members: [
            { id: '4', name: 'Mike Brown', avatar: 'https://i.pravatar.cc/150?img=4' },
            { id: '5', name: 'Anna Lee', avatar: 'https://i.pravatar.cc/150?img=5' },
          ],
          manager: { id: '3', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=3' }
        },
        {
          id: '3',
          name: 'TaskNest Database Design',
          description: 'Design and implement MongoDB schemas and relationships',
          status: 'completed',
          priority: 'medium',
          progress: 100,
          dueDate: '2025-05-15',
          createdAt: '2025-04-01',
          tasks: {
            total: 10,
            completed: 10,
          },
          members: [
            { id: '4', name: 'Mike Brown', avatar: 'https://i.pravatar.cc/150?img=4' },
            { id: '6', name: 'Robert Wilson', avatar: 'https://i.pravatar.cc/150?img=6' },
          ],
          manager: { id: '3', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=3' }
        },
      ];
      
      // In real implementation, we would use the actual data from the API
      // setProjects(data);
      setProjects(mockProjects);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderProjectStatus = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Completed</span>;
      case 'on-hold':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">On Hold</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        {hasRole(['admin', 'manager']) && (
          <Link
            to="/projects/create"
            className="btn-primary"
          >
            Create Project
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search projects..."
              className="form-input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Projects
            </button>
            <button
              onClick={() => setFilter('my-projects')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                filter === 'my-projects' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Projects
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                filter === 'active' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                filter === 'completed' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? "No projects match your search criteria." 
                : "Get started by creating a new project."}
            </p>
            {hasRole(['admin', 'manager']) && !searchTerm && (
              <div className="mt-6">
                <Link
                  to="/projects/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Project
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <Link
                to={`/projects/${project.id}`}
                key={project.id}
                className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                    {renderProjectStatus(project.status)}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-500">Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-xs text-gray-500">
                        {project.tasks.completed}/{project.tasks.total} Tasks
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">Progress</span>
                      <span className="text-xs font-medium text-gray-700">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map(member => (
                        <img
                          key={member.id}
                          className="w-7 h-7 rounded-full border-2 border-white object-cover"
                          src={member.avatar}
                          alt={member.name}
                          title={member.name}
                        />
                      ))}
                      {project.members.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <svg className="w-4 h-4 text-gray-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{project.manager.name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;
