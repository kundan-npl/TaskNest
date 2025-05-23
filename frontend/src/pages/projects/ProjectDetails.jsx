import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import fileService from '../../services/fileService';
import { useAuth } from '../../context/AuthContext.jsx';
import FileUploader from '../../components/common/FileUploader';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, hasRole } = useAuth();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    if (project) {
      fetchProjectFiles();
    }
  }, [project]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // For now, let's use mock data
      const mockProject = {
        id: id,
        name: 'TaskNest Frontend Development',
        description: 'Develop the UI components for TaskNest project management application including a responsive dashboard, project management views, task management components, and user profile settings.',
        status: 'active',
        priority: 'high',
        progress: 65,
        startDate: '2025-04-10',
        dueDate: '2025-06-15',
        createdAt: '2025-04-10',
        createdBy: { id: '3', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=3' },
        manager: { id: '3', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=3' },
        budget: 25500,
        currency: 'USD'
      };

      const mockMembers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'team-member', avatar: 'https://i.pravatar.cc/150?img=1' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'team-member', avatar: 'https://i.pravatar.cc/150?img=2' },
        { id: '3', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'manager', avatar: 'https://i.pravatar.cc/150?img=3' },
      ];

      const mockTasks = [
        {
          id: '1',
          title: 'Design Dashboard Layout',
          description: 'Create wireframes and prototype for the main dashboard layout',
          status: 'completed',
          priority: 'high',
          dueDate: '2025-04-25',
          createdAt: '2025-04-12',
          assignedTo: { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' }
        },
        {
          id: '2',
          title: 'Implement User Authentication UI',
          description: 'Create login, register and forgot password pages with validation',
          status: 'completed',
          priority: 'high',
          dueDate: '2025-04-30',
          createdAt: '2025-04-12',
          assignedTo: { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' }
        },
        {
          id: '3',
          title: 'Build Project List Component',
          description: 'Create a component to display all projects with filtering and sorting options',
          status: 'in-progress',
          priority: 'medium',
          dueDate: '2025-05-10',
          createdAt: '2025-04-15',
          assignedTo: { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' }
        },
        {
          id: '4',
          title: 'Create Task Management Components',
          description: 'Build drag and drop task board, task details modal, and task creation form',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2025-05-20',
          createdAt: '2025-04-18',
          assignedTo: { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' }
        },
        {
          id: '5',
          title: 'Implement Project Analytics Charts',
          description: 'Create charts and graphs for project analytics dashboard',
          status: 'not-started',
          priority: 'medium',
          dueDate: '2025-05-30',
          createdAt: '2025-04-20',
          assignedTo: null
        }
      ];
      
      // In a real implementation, we would fetch data from the API
      // const project = await projectService.getProjectById(id);
      // const members = await projectService.getProjectMembers(id);
      // const tasks = await projectService.getProjectTasks(id);
      
      setProject(mockProject);
      setMembers(mockMembers);
      setTasks(mockTasks);
    } catch (error) {
      toast.error(error.message || 'Failed to load project data');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectFiles = async () => {
    try {
      setLoadingFiles(true);
      const files = await fileService.listFiles({ projectId: id });
      setProjectFiles(files);
      setLoadingFiles(false);
    } catch (error) {
      console.error('Error fetching project files:', error);
      toast.error('Failed to load project files');
      setLoadingFiles(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      // await projectService.deleteProject(id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      toast.error(error.message || 'Failed to delete project');
    }
  };

  const handleFileUpload = (uploadedFiles) => {
    // Refresh the file list after upload
    fetchProjectFiles();
    setShowFileUploader(false);
    toast.success('Files uploaded successfully');
  };

  const handleFileDownload = async (fileKey) => {
    try {
      const downloadUrl = await fileService.getDownloadUrl(fileKey);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleFileDelete = async (fileKey) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await fileService.deleteFile(fileKey);
        // Refresh the file list after deletion
        fetchProjectFiles();
        toast.success('File deleted successfully');
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error('Failed to delete file');
      }
    }
  };

  // Format a date string
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render the project data once loaded
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-800">Project not found</h2>
        <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/projects" className="mt-4 inline-block btn-primary">
          Return to Projects
        </Link>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    return task.status === taskFilter;
  });

  // Determine if user has edit permissions
  const canEdit = currentUser && (
    hasRole(['admin', 'manager']) || 
    project.createdBy?.id === currentUser.id || 
    project.manager?.id === currentUser.id
  );

  return (
    <div className="space-y-8">
      {/* Project header with actions */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`badge ${project.status === 'active' ? 'badge-success' : project.status === 'completed' ? 'badge-info' : 'badge-warning'}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>
        {canEdit && (
          <div className="flex space-x-2">
            <Link 
              to={`/projects/edit/${project.id}`}
              className="btn-secondary flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Edit
            </Link>
            <button 
              className="btn-danger flex items-center"
              onClick={() => setConfirmDelete(true)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Project details cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project info card */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Priority</p>
              <div className="flex items-center mt-1">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  project.priority === 'high' ? 'bg-red-500' :
                  project.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></span>
                <p className="text-gray-900 capitalize">{project.priority}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Timeline</p>
              <p className="text-gray-900">{formatDate(project.startDate)} - {formatDate(project.dueDate)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <div className="flex items-center mt-1">
                <img 
                  src={project.createdBy?.avatar} 
                  alt={project.createdBy?.name} 
                  className="w-6 h-6 rounded-full mr-2" 
                />
                <p className="text-gray-900">{project.createdBy?.name}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Project Manager</p>
              <div className="flex items-center mt-1">
                <img 
                  src={project.manager?.avatar} 
                  alt={project.manager?.name} 
                  className="w-6 h-6 rounded-full mr-2" 
                />
                <p className="text-gray-900">{project.manager?.name}</p>
              </div>
            </div>
            
            {project.budget && (
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: project.currency || 'USD'
                  }).format(project.budget)}
                </p>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs mt-1 text-gray-600">{project.progress || 0}%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Project files card */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Project Files</h3>
            {canEdit && (
              <button 
                onClick={() => setShowFileUploader(!showFileUploader)} 
                className="btn-primary btn-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {showFileUploader ? 'Cancel' : 'Upload'}
              </button>
            )}
          </div>
          
          {showFileUploader && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <FileUploader 
                onUpload={handleFileUpload} 
                multiple={true} 
                maxSize={50}
                allowedTypes="pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif"
                projectId={project.id}
              />
            </div>
          )}
          
          {loadingFiles ? (
            <div className="flex justify-center py-8">
              <div className="loader"></div>
            </div>
          ) : projectFiles.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {projectFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded bg-gray-100 ${
                      file.contentType?.includes('image') ? 'bg-blue-50' :
                      file.contentType?.includes('pdf') ? 'bg-red-50' :
                      file.contentType?.includes('document') || file.contentType?.includes('msword') ? 'bg-blue-50' :
                      file.contentType?.includes('sheet') || file.contentType?.includes('excel') ? 'bg-green-50' :
                      'bg-gray-50'
                    }`}>
                      {file.contentType?.includes('image') ? (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      ) : file.contentType?.includes('pdf') ? (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">{file.filename}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()} • {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown size'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleFileDownload(file.key)}
                      className="p-1 text-gray-600 hover:text-primary-600"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleFileDelete(file.key)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">No files uploaded yet.</p>
              {canEdit && !showFileUploader && (
                <button 
                  onClick={() => setShowFileUploader(true)}
                  className="mt-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  Upload a file
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Team members card */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
          
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-8 h-8 rounded-full mr-3" 
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="flex-shrink-0">
                    <Link 
                      to={`/projects/${id}/members/${member.id}/edit`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {canEdit && (
            <div className="mt-4">
              <Link 
                to={`/projects/${id}/members/add`}
                className="btn-primary flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Member
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Tasks section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Recent Tasks</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                taskFilter === 'all' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                taskFilter === 'completed' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setTaskFilter('in-progress')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                taskFilter === 'in-progress' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setTaskFilter('not-started')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                taskFilter === 'not-started' 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Started
            </button>
          </div>
        </div>
        
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {taskFilter !== 'all' 
                ? `No ${taskFilter} tasks found.`
                : "Get started by creating a new task."}
            </p>
            <div className="mt-6">
              <Link
                to={`/projects/${id}/tasks/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Task
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderTaskStatus(task.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(task.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignedTo ? (
                        <div className="flex items-center">
                          <img 
                            src={task.assignedTo.avatar} 
                            alt={task.assignedTo.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <div className="text-sm font-medium text-gray-900">
                            {task.assignedTo.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Files section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Project Files</h2>
          {hasRole(['admin', 'manager']) && (
            <button
              onClick={() => setShowFileUploader(true)}
              className="btn-primary text-sm"
            >
              Upload Files
            </button>
          )}
        </div>
        
        {loadingFiles ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : projectFiles.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No files have been uploaded for this project yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projectFiles.map(file => (
              <div key={file.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-gray-400 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7m-8 4h4m-2-2v4m-4-4h4m-2-2v2m-4 4h2m-2 2v2m8-8h2m-2-2v2m-4 4h2m-2 2v2" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleFileDownload(file.key)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-4"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleFileDelete(file.key)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* File uploader modal */}
      {showFileUploader && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full z-10">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Project Files</h3>
            
            <FileUploader 
              projectId={id}
              onUpload={handleFileUpload}
              onClose={() => setShowFileUploader(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
