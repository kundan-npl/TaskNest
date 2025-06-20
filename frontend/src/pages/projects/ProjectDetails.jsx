import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import discussionService from '../../services/discussionService';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { ROLE_PERMISSIONS, getUserRole, hasPermission } from '../../utils/projectHelpers';
import '../../assets/styles/widgets.css';

// Widget Components
import ProjectOverviewWidget from '../../components/projects/widgets/ProjectOverviewWidget';
import TaskManagementWidget from '../../components/projects/widgets/TaskManagementWidget';
import TeamManagementWidget from '../../components/projects/widgets/TeamManagementWidget';
import CommunicationWidget from '../../components/projects/widgets/CommunicationWidget';
import FilesWidget from '../../components/projects/widgets/FilesWidget';
import MilestonesWidget from '../../components/projects/widgets/MilestonesWidget';
import NotificationWidget from '../../components/projects/widgets/NotificationWidget';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, hasRole } = useAuth();
  const { joinProjectRoom, leaveProjectRoom, sendNotification, emitTyping, stopTyping, isConnected, socket } = useSocket();
  
  // Core state management
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Data collections
  const [discussions, setDiscussions] = useState([]);
  const [milestones, setMilestones] = useState([]);
  
  // Real-time features
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [notificationPreferences, setNotificationPreferences] = useState({
    taskUpdates: true,
    projectUpdates: true,
    newMessages: true,
    mentions: true,
    deadlineReminders: true,
    realTimeIndicators: true
  });

  // Permission checking utilities
  const checkPermission = (permission) => {
    return hasPermission(project, currentUser, permission);
  };

  const userRole = getUserRole(project, currentUser);

  // Data fetching functions
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const projectResponse = await projectService.getProject(id);
      
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data);
        
        const tasksResponse = await taskService.getProjectTasks(id);
        setTasks(tasksResponse.data || []);
        
        setMembers(projectResponse.data.members || []);
      } else {
        setError('Project not found or invalid response');
      }
      
    } catch (error) {
      console.error('Error fetching project data:', error);
      setError(error.message || 'Failed to load project data');
      toast.error(error.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    try {
      const response = await discussionService.getProjectDiscussions(id);
      setDiscussions(response.data);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const fetchMilestones = async () => {
    try {
      const response = await projectService.getProjectMilestones(id);
      setMilestones(response.data);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  // Project management handlers
  const handleDeleteProject = async () => {
    try {
      await projectService.deleteProject(id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
    toast.success('Project updated successfully');
  };

  // Task management handlers
  const handleTaskUpdate = (updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      )
    );
  };

  const handleTaskCreate = (newTask) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
    toast.success('Task created successfully');
  };

  const handleTaskDelete = (taskId) => {
    setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
    toast.success('Task deleted successfully');
  };

  // Team management handlers
  const handleMemberAdd = (newMember) => {
    setMembers(prevMembers => [...prevMembers, newMember]);
    toast.success('Member added successfully');
  };

  const handleMemberRemove = (memberId) => {
    setMembers(prevMembers => prevMembers.filter(member => member._id !== memberId));
    toast.success('Member removed successfully');
  };

  const handleRoleChange = (memberId, newRole) => {
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member._id === memberId ? { ...member, role: newRole } : member
      )
    );
    toast.success('Role updated successfully');
  };

  // Communication handlers
  const handleMessageSend = (message) => {
    // Handle message sending logic
    toast.success('Message sent successfully');
  };

  const handleDiscussionCreate = (discussion) => {
    setDiscussions(prevDiscussions => [...prevDiscussions, discussion]);
    toast.success('Discussion created successfully');
  };

  // Milestone handlers
  const handleMilestoneUpdate = (updatedMilestone) => {
    setMilestones(prevMilestones =>
      prevMilestones.map(milestone =>
        milestone._id === updatedMilestone._id ? updatedMilestone : milestone
      )
    );
  };

  // Effect hooks
  useEffect(() => {
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    if (project) {
      fetchDiscussions();
      fetchMilestones();
    }
  }, [project]);

  // Socket room management for real-time features
  useEffect(() => {
    if (project && currentUser && joinProjectRoom) {
      joinProjectRoom(project._id || project.id, {
        userId: currentUser._id || currentUser.id,
        userName: currentUser.name,
        userRole: userRole
      });

      return () => {
        if (leaveProjectRoom) {
          leaveProjectRoom(project._id || project.id);
        }
      };
    }
  }, [project, currentUser, joinProjectRoom, leaveProjectRoom, userRole]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-center">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'The requested project could not be found.'}</p>
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
          >
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/projects"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.title}
              </h1>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  project.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                  project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  project.status === 'planning' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {project.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.priorityLevel === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  project.priorityLevel === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                  project.priorityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {project.priorityLevel} priority
                </span>
              </div>
            </div>
            
            {checkPermission('canDeleteProject') && (
              <div className="flex items-center space-x-3">
                {checkPermission('canEditProject') && (
                  <Link
                    to={`/projects/${id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Edit Project
                  </Link>
                )}
                <button 
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="p-4 lg:p-6">
        <div className="widgets-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Project Overview Widget - Spans full width on mobile, 2 cols on lg screens */}
          <div className="lg:col-span-2">
            <ProjectOverviewWidget
              project={project}
              tasks={tasks}
              userRole={userRole}
              permissions={{
                canEdit: checkPermission('canEditProject'),
                canDelete: checkPermission('canDeleteProject')
              }}
              onUpdate={handleProjectUpdate}
              className="widget-card h-full"
            />
          </div>

          {/* Notifications Widget */}
          <div>
            <NotificationWidget
              project={project}
              preferences={notificationPreferences}
              onPreferencesChange={setNotificationPreferences}
              className="widget-card h-full"
            />
          </div>

          {/* Task Management Widget - Full width */}
          <div className="lg:col-span-3">
            <TaskManagementWidget
              tasks={tasks}
              project={project}
              userRole={userRole}
              permissions={{
                canCreate: checkPermission('canCreateTasks'),
                canEdit: checkPermission('canEditTasks'),
                canDelete: checkPermission('canDeleteTasks'),
                canAssign: checkPermission('canAssignTasks')
              }}
              onTaskUpdate={handleTaskUpdate}
              onTaskCreate={handleTaskCreate}
              onTaskDelete={handleTaskDelete}
              className="widget-card"
            />
          </div>

          {/* Team Management Widget */}
          <div>
            <TeamManagementWidget
              members={members}
              project={project}
              currentUser={currentUser}
              userRole={userRole}
              permissions={{
                canManage: checkPermission('canManageTeam'),
                canInvite: checkPermission('canInviteMembers'),
                canRemove: checkPermission('canRemoveMembers'),
                canChangeRoles: checkPermission('canManageRoles')
              }}
              onMemberAdd={handleMemberAdd}
              onMemberRemove={handleMemberRemove}
              onRoleChange={handleRoleChange}
              className="widget-card h-full"
            />
          </div>

          {/* Communication Widget */}
          <div>
            <CommunicationWidget
              discussions={discussions}
              project={project}
              currentUser={currentUser}
              userRole={userRole}
              permissions={{
                canSendMessage: checkPermission('canSendMessage'),
                canModerate: checkPermission('canModerateDiscussions'),
                canPin: checkPermission('canPinMessages'),
                canCreateAnnouncements: checkPermission('canCreateAnnouncements'),
                canCreateDiscussion: checkPermission('canCreateDiscussion')
              }}
              onMessageSend={handleMessageSend}
              onDiscussionCreate={handleDiscussionCreate}
              className="widget-card h-full"
            />
          </div>

          {/* Files Widget */}
          <div>
            <FilesWidget
              project={project}
              userRole={userRole}
              permissions={{
                canManage: checkPermission('canManageFiles'),
                canUpload: checkPermission('canManageFiles'),
                canDelete: checkPermission('canManageFiles')
              }}
              className="widget-card h-full"
            />
          </div>

          {/* Milestones Widget - Spans 2 columns */}
          <div className="md:col-span-2">
            <MilestonesWidget
              milestones={milestones}
              project={project}
              userRole={userRole}
              permissions={{
                canManage: checkPermission('canEditProject'),
                canExport: checkPermission('canExportReports')
              }}
              onMilestoneUpdate={handleMilestoneUpdate}
              className="widget-card h-full"
            />
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50 transition-all duration-200">
          <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">Delete Project</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete this project? This action cannot be undone and will permanently remove all project data, tasks, and files.
                </p>
              </div>
              <div className="items-center px-4 py-3 space-x-2">
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white text-base font-medium rounded-md w-24 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 transition-colors duration-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white text-base font-medium rounded-md w-24 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for widget styling */}
      <style>{`
        .widget-card {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease-in-out;
          min-height: 350px;
        }
        
        .widget-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-color: #d1d5db;
          transform: translateY(-1px);
        }
        
        .dark .widget-card {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
        }
        
        .dark .widget-card:hover {
          border-color: #4b5563;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
        }
        
        /* Improved text contrast */
        .widget-card h1, .widget-card h2, .widget-card h3, .widget-card h4, .widget-card h5, .widget-card h6 {
          color: #111827;
        }
        
        .dark .widget-card h1, .dark .widget-card h2, .dark .widget-card h3, .dark .widget-card h4, .dark .widget-card h5, .dark .widget-card h6 {
          color: #f9fafb;
        }
        
        .widget-card p, .widget-card span {
          color: #374151;
        }
        
        .dark .widget-card p, .dark .widget-card span {
          color: #d1d5db;
        }
        
        /* Animation improvements */
        @media (prefers-reduced-motion: no-preference) {
          .widget-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
        
        /* Remove any extra margin/padding that might cause spacing issues */
        .widgets-container {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default ProjectDetails;
