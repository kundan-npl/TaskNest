import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import fileService from '../../services/fileService';
import discussionService from '../../services/discussionService';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import FileUploader from '../../components/common/FileUploader';
import RoleBasedTestSuite from '../../components/testing/RoleBasedTestSuite';
import { OnlineUsersIndicator, TypingIndicator } from '../../components/common/RealTimeIndicators.jsx';
import NotificationSettings from '../../components/common/NotificationSettings.jsx';
import ConnectionManager from '../../components/common/ConnectionManager.jsx';

// Helper functions
const getPriorityColor = (priority) => {
  const priorityLower = priority?.toLowerCase() || '';
  switch (priorityLower) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'active': case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'planning': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'not-started': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getProgressPercentage = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter(task => task.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
};



const getTimeLeft = (deadline) => {
  if (!deadline) return 'No deadline';
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  
  if (diff < 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} days left`;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours} hours left`;
};

// Role-based permissions configuration
const ROLE_PERMISSIONS = {
  supervisor: {
    canEditProject: true,
    canDeleteProject: true,
    canManageTeam: true,
    canAssignTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewAnalytics: true,
    canExportReports: true,
    canManageFiles: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canManageRoles: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canViewFinancials: true,
    canModerateDiscussions: true,
    canPinMessages: true,
    canCreateAnnouncements: true
  },
  teamLead: {
    canEditProject: false,
    canDeleteProject: false,
    canManageTeam: true,
    canAssignTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canViewAnalytics: true,
    canExportReports: true,
    canManageFiles: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canManageRoles: false,
    canInviteMembers: true,
    canRemoveMembers: false,
    canViewFinancials: false,
    canModerateDiscussions: true,
    canPinMessages: false,
    canCreateAnnouncements: false
  },
  teamMember: {
    canEditProject: false,
    canDeleteProject: false,
    canManageTeam: false,
    canAssignTasks: false,
    canEditTasks: true, // Only own tasks
    canDeleteTasks: false,
    canViewAnalytics: false,
    canExportReports: false,
    canManageFiles: false,
    canViewAllTasks: true,
    canCreateTasks: false,
    canManageRoles: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canViewFinancials: false,
    canModerateDiscussions: false,
    canPinMessages: false,
    canCreateAnnouncements: false
  }
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, hasRole } = useAuth();
  const { joinProjectRoom, leaveProjectRoom, sendNotification, emitTyping, stopTyping, isConnected, socket } = useSocket();
  
  // State management
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('messages');
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskView, setTaskView] = useState('list'); // 'list' or 'board'
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('team-member');
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [showReconnectionToast, setShowReconnectionToast] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    taskUpdates: true,
    projectUpdates: true,
    newMessages: true,
    mentions: true,
    deadlineReminders: true,
    realTimeIndicators: true
  });
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // Permission checking utilities
  const getUserRole = () => {
    if (!project || !currentUser) return 'teamMember';
    const member = project.members.find(m => m.user._id === currentUser._id || m.user._id === currentUser.id);
    return member ? member.role : 'teamMember';
  };

  const hasPermission = (permission) => {
    const userRole = getUserRole();
    return ROLE_PERMISSIONS[userRole]?.[permission] || false;
  };

  const canAccessTab = (tabId) => {
    switch (tabId) {
      case 'overview':
        return true; // Everyone can access overview
      case 'tasks':
        return true; // Everyone can view tasks
      case 'team':
        return hasPermission('canManageTeam') || hasPermission('canViewAllTasks');
      case 'communication':
        return true; // Everyone can access communication
      case 'analytics':
        return hasPermission('canViewAnalytics');
      case 'testing':
        return true; // Allow everyone to access testing tab for demo purposes
      default:
        return false;
    }
  };

  const getAccessibleTabs = () => {
    return tabs.filter(tab => canAccessTab(tab.id));
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', name: 'Project Overview', icon: '📊', description: 'Project details and status' },
    { id: 'tasks', name: 'Tasks & Timeline', icon: '✅', description: 'Task management and progress tracking' },
    { id: 'team', name: 'Team Management', icon: '👥', description: 'Manage team members and roles' },
    { id: 'communication', name: 'Communication', icon: '💬', description: 'Messages and file sharing' },
    { id: 'analytics', name: 'Analytics & Reports', icon: '📈', description: 'Performance metrics and reports' },
    { id: 'testing', name: 'Role Testing', icon: '🧪', description: 'Test role-based access control permissions' }
  ];

  const communicationSubTabs = [
    { id: 'messages', name: 'Messages', icon: '💬' },
    { id: 'files', name: 'Files & Resources', icon: '📁' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    if (project) {
      fetchProjectFiles();
      fetchDiscussions();
    }
  }, [project]);

  // Socket room management for real-time features
  useEffect(() => {
    if (project && currentUser && joinProjectRoom) {
      // Join project room for real-time updates
      joinProjectRoom(project._id || project.id, {
        userId: currentUser._id || currentUser.id,
        userName: currentUser.name,
        userRole: getUserRole()
      });

      // Cleanup function to leave room when component unmounts
      return () => {
        if (leaveProjectRoom) {
          leaveProjectRoom(project._id || project.id);
        }
      };
    }
  }, [project, currentUser, joinProjectRoom, leaveProjectRoom]);

  // Enhanced connection monitoring and error handling
  useEffect(() => {
    if (!socket) return;

    // Connection error handler
    const handleConnectionError = (error) => {
      console.error('Socket connection error:', error);
      setConnectionError('Connection lost. Attempting to reconnect...');
      toast.error('Connection lost. Attempting to reconnect...', { 
        position: 'bottom-right',
        toastId: 'connection-error' // Prevent duplicate toasts
      });
    };

    // Reconnection attempt handler
    const handleReconnectAttempt = (attempt) => {
      setReconnectionAttempts(attempt);
      setConnectionError(`Reconnecting... (Attempt ${attempt})`);
      toast.info(`Reconnecting... (Attempt ${attempt})`, { 
        position: 'bottom-right',
        toastId: 'reconnection-attempt'
      });
    };

    // Successful reconnection handler
    const handleReconnect = () => {
      setConnectionError(null);
      setReconnectionAttempts(0);
      setShowReconnectionToast(true);
      toast.success('Connection restored!', { 
        position: 'bottom-right',
        toastId: 'reconnection-success'
      });
      
      // Re-join project room after reconnection
      if (project && currentUser && joinProjectRoom) {
        joinProjectRoom(project._id || project.id, {
          userId: currentUser._id || currentUser.id,
          userName: currentUser.name,
          userRole: getUserRole()
        });
      }
      
      // Hide reconnection toast after 3 seconds
      setTimeout(() => setShowReconnectionToast(false), 3000);
    };

    // Connection disconnection handler
    const handleDisconnect = (reason) => {
      console.warn('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, no reconnection
        setConnectionError('Connection terminated by server');
        toast.error('Connection terminated by server', { 
          position: 'bottom-right',
          toastId: 'server-disconnect'
        });
      } else {
        // Client initiated or network issue, will auto-reconnect
        setConnectionError('Connection interrupted');
        toast.warning('Connection interrupted', { 
          position: 'bottom-right',
          toastId: 'connection-interrupt'
        });
      }
    };

    // Add socket event listeners
    socket.on('connect_error', handleConnectionError);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect_error', handleConnectionError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, project, currentUser, joinProjectRoom]);

  // Manual reconnection function for user-initiated reconnection
  const handleManualReconnect = async () => {
    if (!socket || isConnected) return Promise.resolve();
    
    try {
      setConnectionError('Manually reconnecting...');
      setReconnectionAttempts(prev => prev + 1);
      
      // Force socket to disconnect and reconnect
      socket.disconnect();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Manual reconnection timeout'));
        }, 10000); // 10 second timeout
        
        const onConnect = () => {
          clearTimeout(timeout);
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          resolve();
        };
        
        const onConnectError = (error) => {
          clearTimeout(timeout);
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          reject(error);
        };
        
        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);
        socket.connect();
      });
    } catch (error) {
      console.error('Manual reconnection failed:', error);
      throw error;
    }
  };

  // Force disconnect function for user-initiated disconnection
  const handleForceDisconnect = () => {
    if (!socket || !isConnected) return;
    
    try {
      // Leave project room before disconnecting
      if (project && leaveProjectRoom) {
        leaveProjectRoom(project._id || project.id);
      }
      
      // Force disconnect
      socket.disconnect();
      setConnectionError('Manually disconnected');
      setReconnectionAttempts(0);
    } catch (error) {
      console.error('Force disconnect failed:', error);
    }
  };

  // Track last connected time for connection manager
  const [lastConnectedTime, setLastConnectedTime] = useState(null);
  
  useEffect(() => {
    if (isConnected) {
      setLastConnectedTime(new Date().toISOString());
    }
  }, [isConnected]);

  // Real-time event listeners for live updates with enhanced error handling
  useEffect(() => {
    if (!project) return;

    // Debounced update function to prevent too frequent updates
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    // Handler for task updates with error handling
    const handleTaskUpdate = (event) => {
      try {
        const { task, action } = event.detail;
        
        if (!task || !action) {
          console.warn('Invalid task update event:', event.detail);
          return;
        }
        
        if (task.projectId === (project._id || project.id)) {
          setTasks(prevTasks => {
            try {
              const updatedTasks = (() => {
                switch (action) {
                  case 'created':
                    if (notificationPreferences.taskUpdates) {
                      toast.success(`New task created: ${task.title}`, { position: 'bottom-right', autoClose: 3000 });
                    }
                    return [...prevTasks, task];
                  case 'updated':
                    if (notificationPreferences.taskUpdates) {
                      toast.info(`Task updated: ${task.title}`, { position: 'bottom-right', autoClose: 2000 });
                    }
                    return prevTasks.map(t => t._id === task._id ? { ...t, ...task } : t);
                  case 'status_changed':
                    if (notificationPreferences.taskUpdates) {
                      toast.success(`Task status: ${task.title} → ${task.status}`, { position: 'bottom-right' });
                    }
                    return prevTasks.map(t => t._id === task._id ? { ...t, status: task.status, progress: task.progress } : t);
                  case 'deleted':
                    if (notificationPreferences.taskUpdates) {
                      toast.error(`Task deleted: ${task.title}`, { position: 'bottom-right', autoClose: 3000 });
                    }
                    return prevTasks.filter(t => t._id !== task._id);
                  default:
                    return prevTasks.map(t => t._id === task._id ? { ...t, ...task } : t);
                }
              })();
              
              // Update project stats when task status changes (debounced)
              if (action === 'status_changed' || action === 'created' || action === 'deleted') {
                debouncedUpdateProjectStats(updatedTasks);
              }
              
              return updatedTasks;
            } catch (error) {
              console.error('Error updating tasks:', error);
              toast.error('Failed to update task data');
              return prevTasks;
            }
          });
        }
      } catch (error) {
        console.error('Error handling task update:', error);
        toast.error('Failed to process task update');
      }
    };

    // Debounced project stats update
    const debouncedUpdateProjectStats = debounce((updatedTasks) => {
      try {
        const completed = updatedTasks.filter(t => t.status === 'completed').length;
        const total = updatedTasks.length;
        
        setProject(prevProject => ({
          ...prevProject,
          taskStats: { ...prevProject.taskStats, completed, total },
          progress: total > 0 ? Math.round((completed / total) * 100) : 0
        }));
      } catch (error) {
        console.error('Error updating project stats:', error);
      }
    }, 300);

    // Handler for new discussion messages with error handling
    const handleNewDiscussionMessage = (event) => {
      try {
        const { discussionId, message, author } = event.detail;
        
        if (!discussionId || !message || !author) {
          console.warn('Invalid discussion message event:', event.detail);
          return;
        }
        
        setDiscussions(prevDiscussions => {
          try {
            return prevDiscussions.map(discussion => 
              discussion._id === discussionId 
                ? {
                    ...discussion,
                    replies: [...(discussion.replies || []), {
                      _id: message.id || Date.now().toString(),
                      content: message.content,
                      author: author,
                      createdAt: new Date().toISOString()
                    }]
                  }
                : discussion
            );
          } catch (error) {
            console.error('Error updating discussions:', error);
            toast.error('Failed to update discussion');
            return prevDiscussions;
          }
        });
        
        if (author.id !== (currentUser._id || currentUser.id) && notificationPreferences.newMessages) {
          toast.info(`New message from ${author.name}`, { position: 'bottom-right' });
        }
      } catch (error) {
        console.error('Error handling discussion message:', error);
        toast.error('Failed to process new message');
      }
    };

    // Handler for project updates with error handling
    const handleProjectUpdate = (event) => {
      try {
        const { project: updatedProject, action } = event.detail;
        
        if (!updatedProject || !action) {
          console.warn('Invalid project update event:', event.detail);
          return;
        }
        
        if (updatedProject.id === (project._id || project.id)) {
          setProject(prevProject => {
            try {
              return { ...prevProject, ...updatedProject };
            } catch (error) {
              console.error('Error updating project:', error);
              return prevProject;
            }
          });
          
          if (notificationPreferences.projectUpdates) {
            switch (action) {
              case 'member_added':
                toast.success(`New member joined: ${updatedProject.newMember?.name}`, { position: 'bottom-right' });
                break;
              case 'status_changed':
                toast.success(`Project status: ${updatedProject.status}`, { position: 'bottom-right' });
                break;
              default:
                toast.info('Project updated', { position: 'bottom-right' });
            }
          }
        }
      } catch (error) {
        console.error('Error handling project update:', error);
        toast.error('Failed to process project update');
      }
    };

    // Add event listeners
    window.addEventListener('taskUpdated', handleTaskUpdate);
    window.addEventListener('newDiscussionMessage', handleNewDiscussionMessage);
    window.addEventListener('projectUpdated', handleProjectUpdate);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdate);
      window.removeEventListener('newDiscussionMessage', handleNewDiscussionMessage);
      window.removeEventListener('projectUpdated', handleProjectUpdate);
    };
  }, [project, currentUser]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API first, then fall back to enhanced mock data
      try {
        const data = await projectService.getProjectById(id);
        setProject(data);
        setMembers(data.members || []);
      } catch (apiError) {
        console.log('API call failed, using enhanced mock data:', apiError);
        
        // Enhanced mock data with comprehensive project details
        const mockProject = {
          _id: id,
          title: 'TaskNest Frontend Development',
          description: 'Develop a comprehensive project management application with modern UI components, real-time collaboration features, task management, team coordination, and analytics dashboard. This project involves creating a scalable React frontend with advanced features for multi-industry project management.',
          status: 'active',
          priorityLevel: 'high',
          progress: 65,
          startDate: '2024-04-10',
          deadline: '2024-06-15',
          createdAt: '2024-04-10',
          industry: 'Technology',
          department: 'Software Development',
          category: 'Web Application',
          createdBy: { 
            _id: '3', 
            name: 'Shobha Sharma', 
            email: 'shobha@tasknest.com',
            avatar: 'https://ui-avatars.com/api/?name=Shobha+Sharma&background=random'
          },
          manager: {
            _id: '1',
            name: 'Kundan Kumar',
            email: 'kundan@tasknest.com',
            avatar: 'https://ui-avatars.com/api/?name=Kundan+Kumar&background=random'
          },
          members: [
            {
              user: { 
                _id: '1', 
                name: 'Kundan Kumar', 
                email: 'kundan@tasknest.com',
                avatar: 'https://ui-avatars.com/api/?name=Kundan+Kumar&background=random',
                skills: ['React', 'Node.js', 'Project Management'],
                productivity: 92
              },
              role: 'supervisor',
              joinedAt: '2024-04-10',
              isActive: true,
              permissions: ['all']
            },
            {
              user: { 
                _id: '2', 
                name: 'Adira Sharma', 
                email: 'adira@tasknest.com',
                avatar: 'https://ui-avatars.com/api/?name=Adira+Sharma&background=random',
                skills: ['UI/UX Design', 'Frontend Development'],
                productivity: 88
              },
              role: 'teamLead',
              joinedAt: '2024-04-12',
              isActive: true,
              permissions: ['task_management', 'member_view']
            },
            {
              user: { 
                _id: '3', 
                name: 'Shobha Sharma', 
                email: 'shobha@tasknest.com',
                avatar: 'https://ui-avatars.com/api/?name=Shobha+Sharma&background=random',
                skills: ['React', 'Testing', 'Documentation'],
                productivity: 85
              },
              role: 'teamMember',
              joinedAt: '2024-04-15',
              isActive: true,
              permissions: ['task_view']
            },
            {
              user: { 
                _id: '4', 
                name: 'Rahul Verma', 
                email: 'rahul@tasknest.com',
                avatar: 'https://ui-avatars.com/api/?name=Rahul+Verma&background=random',
                skills: ['Backend Development', 'Database Design'],
                productivity: 90
              },
              role: 'teamMember',
              joinedAt: '2024-04-18',
              isActive: true,
              permissions: ['task_view']
            }
          ],
          tags: ['frontend', 'react', 'ui/ux', 'web-development', 'collaboration'],
          taskStats: {
            total: 24,
            completed: 15,
            inProgress: 6,
            notStarted: 2,
            overdue: 1
          },
          milestones: [
            {
              id: 1,
              title: 'UI Design Completion',
              description: 'Complete all wireframes and UI designs',
              dueDate: '2024-05-01',
              status: 'completed',
              progress: 100
            },
            {
              id: 2,
              title: 'Core Components Development',
              description: 'Develop main application components',
              dueDate: '2024-05-20',
              status: 'in-progress',
              progress: 75
            },
            {
              id: 3,
              title: 'Testing & QA',
              description: 'Complete testing and quality assurance',
              dueDate: '2024-06-05',
              status: 'not-started',
              progress: 0
            },
            {
              id: 4,
              title: 'Production Deployment',
              description: 'Deploy to production environment',
              dueDate: '2024-06-15',
              status: 'not-started',
              progress: 0
            }
          ],
          settings: {
            allowMemberInvitations: true,
            requireTaskApproval: false,
            enableNotifications: true,
            visibilityLevel: 'team',
            allowFileSharing: true,
            maxFileSize: 50,
            allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif']
          },
          userRole: currentUser?.id === '1' ? 'supervisor' : 'teamMember',
          userPermissions: currentUser?.id === '1' ? 
            ['canAssignTasks', 'canEditProject', 'canManageMembers', 'canDeleteProject', 'canViewReports', 'canManageFiles'] : 
            ['canViewReports', 'canViewFiles'],
          analytics: {
            weeklyProgress: [
              { week: 'Week 1', progress: 20 },
              { week: 'Week 2', progress: 35 },
              { week: 'Week 3', progress: 50 },
              { week: 'Week 4', progress: 65 }
            ],
            taskDistribution: [
              { status: 'Completed', count: 15, color: '#10B981' },
              { status: 'In Progress', count: 6, color: '#3B82F6' },
              { status: 'Not Started', count: 2, color: '#6B7280' },
              { status: 'Overdue', count: 1, color: '#EF4444' }
            ],
            teamProductivity: [
              { member: 'Kundan Kumar', productivity: 92, tasksCompleted: 8 },
              { member: 'Rahul Verma', productivity: 90, tasksCompleted: 6 },
              { member: 'Adira Sharma', productivity: 88, tasksCompleted: 5 },
              { member: 'Shobha Sharma', productivity: 85, tasksCompleted: 4 }
            ]
          }
        };

        const mockTasks = [
          {
            _id: '1',
            title: 'Design Dashboard Layout',
            description: 'Create wireframes and prototype for the main dashboard layout with responsive design considerations',
            status: 'completed',
            priority: 'high',
            dueDate: '2024-04-25',
            createdAt: '2024-04-12',
            assignedTo: { _id: '1', name: 'Kundan Kumar', email: 'kundan@tasknest.com' },
            progress: 100,
            timeSpent: 16,
            estimatedTime: 16,
            tags: ['design', 'ui'],
            subtasks: [
              { id: 1, title: 'Create wireframes', completed: true },
              { id: 2, title: 'Design prototype', completed: true },
              { id: 3, title: 'Review with team', completed: true }
            ]
          },
          {
            _id: '2',
            title: 'Implement User Authentication UI',
            description: 'Create login, register and forgot password pages with validation and error handling',
            status: 'completed',
            priority: 'high',
            dueDate: '2024-04-30',
            createdAt: '2024-04-12',
            assignedTo: { _id: '2', name: 'Adira Sharma', email: 'adira@tasknest.com' },
            progress: 100,
            timeSpent: 24,
            estimatedTime: 20,
            tags: ['frontend', 'authentication'],
            subtasks: [
              { id: 1, title: 'Login page', completed: true },
              { id: 2, title: 'Register page', completed: true },
              { id: 3, title: 'Password reset', completed: true },
              { id: 4, title: 'Form validation', completed: true }
            ]
          },
          {
            _id: '3',
            title: 'Build Project List Component',
            description: 'Create a component to display all projects with filtering, sorting, and search functionality',
            status: 'in-progress',
            priority: 'medium',
            dueDate: '2024-05-10',
            createdAt: '2024-04-15',
            assignedTo: { _id: '1', name: 'Kundan Kumar', email: 'kundan@tasknest.com' },
            progress: 75,
            timeSpent: 18,
            estimatedTime: 24,
            tags: ['frontend', 'components'],
            subtasks: [
              { id: 1, title: 'Basic list view', completed: true },
              { id: 2, title: 'Add filtering', completed: true },
              { id: 3, title: 'Add sorting', completed: true },
              { id: 4, title: 'Add search', completed: false },
              { id: 5, title: 'Add pagination', completed: false }
            ]
          },
          {
            _id: '4',
            title: 'Create Task Management Components',
            description: 'Build drag and drop task board, task details modal, and task creation form',
            status: 'in-progress',
            priority: 'high',
            dueDate: '2024-05-20',
            createdAt: '2024-04-18',
            assignedTo: { _id: '2', name: 'Adira Sharma', email: 'adira@tasknest.com' },
            progress: 60,
            timeSpent: 28,
            estimatedTime: 40,
            tags: ['frontend', 'task-management'],
            subtasks: [
              { id: 1, title: 'Task board layout', completed: true },
              { id: 2, title: 'Drag and drop', completed: true },
              { id: 3, title: 'Task details modal', completed: false },
              { id: 4, title: 'Task creation form', completed: false },
              { id: 5, title: 'Task editing', completed: false }
            ]
          },
          {
            _id: '5',
            title: 'Implement Project Analytics Charts',
            description: 'Create charts and graphs for project analytics dashboard using Chart.js or similar library',
            status: 'not-started',
            priority: 'medium',
            dueDate: '2024-05-30',
            createdAt: '2024-04-20',
            assignedTo: { _id: '3', name: 'Shobha Sharma', email: 'shobha@tasknest.com' },
            progress: 0,
            timeSpent: 0,
            estimatedTime: 32,
            tags: ['frontend', 'analytics'],
            subtasks: [
              { id: 1, title: 'Choose chart library', completed: false },
              { id: 2, title: 'Progress charts', completed: false },
              { id: 3, title: 'Team productivity charts', completed: false },
              { id: 4, title: 'Task distribution charts', completed: false }
            ]
          },
          {
            _id: '6',
            title: 'Develop Real-time Notifications',
            description: 'Implement real-time notifications system using WebSocket or Server-Sent Events',
            status: 'not-started',
            priority: 'medium',
            dueDate: '2024-06-01',
            createdAt: '2024-04-22',
            assignedTo: { _id: '4', name: 'Rahul Verma', email: 'rahul@tasknest.com' },
            progress: 0,
            timeSpent: 0,
            estimatedTime: 24,
            tags: ['frontend', 'real-time'],
            subtasks: [
              { id: 1, title: 'WebSocket setup', completed: false },
              { id: 2, title: 'Notification component', completed: false },
              { id: 3, title: 'Sound notifications', completed: false },
              { id: 4, title: 'Browser notifications', completed: false }
            ]
          }
        ];

        const mockFiles = [
          {
            id: '1',
            filename: 'Project_Requirements.pdf',
            size: 2048000,
            contentType: 'application/pdf',
            createdAt: '2024-04-12T10:00:00Z',
            uploadedBy: { name: 'Kundan Kumar', id: '1' },
            key: 'project-requirements-pdf'
          },
          {
            id: '2',
            filename: 'UI_Mockups.fig',
            size: 15728640,
            contentType: 'application/octet-stream',
            createdAt: '2024-04-15T14:30:00Z',
            uploadedBy: { name: 'Adira Sharma', id: '2' },
            key: 'ui-mockups-fig'
          },
          {
            id: '3',
            filename: 'Technical_Specifications.docx',
            size: 1024000,
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            createdAt: '2024-04-18T09:15:00Z',
            uploadedBy: { name: 'Shobha Sharma', id: '3' },
            key: 'technical-specifications-docx'
          }
        ];
        
        setProject(mockProject);
        setMembers(mockProject.members);
        setTasks(mockTasks);
        setMilestones(mockProject.milestones);
        setProjectFiles(mockFiles);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
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
    } catch (error) {
      console.error('Error fetching project files:', error);
      // Don't show error toast for files as we have mock data
    } finally {
      setLoadingFiles(false);
    }
  };

  // Discussion Management Functions
  const fetchDiscussions = async () => {
    try {
      const discussionsData = await discussionService.getProjectDiscussions(id);
      setDiscussions(discussionsData);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      // Use mock data if API fails
      setDiscussions([
        {
          _id: '1',
          title: 'Project Kickoff Discussion',
          content: 'Welcome to the project! Let\'s discuss our goals and timeline.',
          category: 'announcement',
          author: { _id: '1', name: 'Kundan Kumar', profileImage: 'https://ui-avatars.com/api/?name=Kundan+Kumar' },
          isPinned: true,
          likes: [{ user: '2' }, { user: '3' }],
          replies: [
            {
              _id: 'r1',
              content: 'Excited to work on this project!',
              author: { _id: '2', name: 'Adira Sharma', profileImage: 'https://ui-avatars.com/api/?name=Adira+Sharma' },
              createdAt: '2024-04-11T10:00:00Z',
              likes: []
            }
          ],
          createdAt: '2024-04-10T09:00:00Z',
          views: [{ user: '1' }, { user: '2' }, { user: '3' }]
        },
        {
          _id: '2',
          title: 'Technical Architecture Discussion',
          content: 'Let\'s discuss the technical approach for this project.',
          category: 'general',
          author: { _id: '2', name: 'Adira Sharma', profileImage: 'https://ui-avatars.com/api/?name=Adira+Sharma' },
          isPinned: false,
          likes: [],
          replies: [],
          createdAt: '2024-04-12T14:30:00Z',
          views: [{ user: '1' }, { user: '2' }]
        }
      ]);
    }
  };

  const createDiscussion = async (discussionData) => {
    try {
      const newDiscussion = await discussionService.createDiscussion({
        ...discussionData,
        project: id,
        author: currentUser._id || currentUser.id
      });
      setDiscussions(prev => [newDiscussion, ...prev]);
      setShowCreateDiscussion(false);
      toast.success('Discussion created successfully');
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast.error('Failed to create discussion');
    }
  };

  const addReply = async (discussionId, content) => {
    try {
      const updatedDiscussion = await discussionService.addReply(discussionId, {
        content,
        author: currentUser._id || currentUser.id
      });
      setDiscussions(prev => 
        prev.map(d => d._id === discussionId ? updatedDiscussion : d)
      );
      setNewMessage('');
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  };

  const toggleDiscussionLike = async (discussionId) => {
    try {
      const updatedDiscussion = await discussionService.toggleLike(discussionId);
      setDiscussions(prev => 
        prev.map(d => d._id === discussionId ? updatedDiscussion : d)
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleDiscussionPin = async (discussionId) => {
    if (!hasPermission('canModerateDiscussions')) {
      toast.error('You do not have permission to pin discussions');
      return;
    }
    
    try {
      const updatedDiscussion = await discussionService.togglePin(discussionId);
      setDiscussions(prev => 
        prev.map(d => d._id === discussionId ? updatedDiscussion : d)
      );
      toast.success('Discussion pin status updated');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update pin status');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectService.deleteProject(id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      toast.error(error.message || 'Failed to delete project');
    }
  };

  const handleFileUpload = (uploadedFiles) => {
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
        fetchProjectFiles();
        toast.success('File deleted successfully');
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error('Failed to delete file');
      }
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    try {
      // API call would go here
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('team-member');
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  // Enhanced typing event handler for real-time indicators with performance optimization
  const handleTyping = (discussionId, isTyping = true) => {
    if (!emitTyping || !stopTyping || !currentUser || !isConnected) {
      console.warn('Typing handler: Missing dependencies or disconnected');
      return;
    }

    try {
      const room = `discussion_${discussionId}`;
      
      if (isTyping) {
        // Clear any existing timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        
        // Emit typing event with error handling
        try {
          emitTyping(room, {
            userId: currentUser._id || currentUser.id,
            userName: currentUser.name,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Error emitting typing event:', error);
          return;
        }
        
        // Set timeout to stop typing after 3 seconds of no activity
        const timeout = setTimeout(() => {
          try {
            stopTyping(room, {
              userId: currentUser._id || currentUser.id,
              userName: currentUser.name
            });
          } catch (error) {
            console.error('Error stopping typing event:', error);
          }
        }, 3000);
        
        setTypingTimeout(timeout);
      } else {
        // Clear timeout and stop typing
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          setTypingTimeout(null);
        }
        
        try {
          stopTyping(room, {
            userId: currentUser._id || currentUser.id,
            userName: currentUser.name
          });
        } catch (error) {
          console.error('Error stopping typing event:', error);
        }
      }
    } catch (error) {
      console.error('Error in typing handler:', error);
      toast.error('Failed to send typing indicator');
    }
  };

  // Handle notification preferences update
  const updateNotificationPreferences = (preference, value) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [preference]: value
    }));
    
    // Save to localStorage for persistence
    const updatedPrefs = { ...notificationPreferences, [preference]: value };
    localStorage.setItem(`notification_prefs_${project._id || project.id}`, JSON.stringify(updatedPrefs));
    
    toast.success(`Notification preferences updated`, { 
      position: 'bottom-right',
      autoClose: 2000
    });
  };

  // Load notification preferences on mount
  useEffect(() => {
    if (project) {
      const saved = localStorage.getItem(`notification_prefs_${project._id || project.id}`);
      if (saved) {
        try {
          setNotificationPreferences(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading notification preferences:', error);
        }
      }
    }
  }, [project]);

  const renderTaskStatus = (status) => {
    const statusConfig = {
      'completed': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'not-started': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
      'overdue': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };
    
    const config = statusConfig[status] || statusConfig['not-started'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  // Component sections
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{project.taskStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-green-600 text-sm font-medium">
              {Math.round((project.taskStats.completed / project.taskStats.total) * 100)}% completed
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{project.members.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-green-600 text-sm font-medium">
              {project.members.filter(m => m.isActive).length} active
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Left</p>
              <p className="text-2xl font-bold text-gray-900">{getTimeLeft(project.deadline)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-gray-600 text-sm">
              Due {formatDate(project.deadline)}
            </span>
          </div>
        </div>
      </div>

      {/* Project Information and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Priority:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priorityLevel)}`}>
                {project.priorityLevel.charAt(0).toUpperCase() + project.priorityLevel.slice(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Industry:</span>
              <span className="text-sm text-gray-900">{project.industry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Department:</span>
              <span className="text-sm text-gray-900">{project.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Start Date:</span>
              <span className="text-sm text-gray-900">{formatDate(project.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Deadline:</span>
              <span className="text-sm text-gray-900">{formatDate(project.deadline)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{project.taskStats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{project.taskStats.inProgress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h3>
        <div className="space-y-4">
          {project.milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    milestone.status === 'completed' ? 'bg-green-500' :
                    milestone.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                    {milestone.status.replace('-', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-6">{milestone.description}</p>
                <div className="flex items-center space-x-4 mt-2 ml-6">
                  <span className="text-xs text-gray-500">Due: {formatDate(milestone.dueDate)}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{milestone.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TasksTab = () => {
    const filteredTasks = tasks.filter(task => {
      if (taskFilter === 'all') return true;
      return task.status === taskFilter;
    });

    const TaskListView = () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <tr key={task._id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">{task.description.substring(0, 60)}...</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.tags?.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {renderTaskStatus(task.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{task.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {task.assignedTo ? (
                    <div className="flex items-center">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo.name)}&background=random`}
                        alt={task.assignedTo.name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <span className="text-sm text-gray-900">{task.assignedTo.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{formatDate(task.dueDate)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const TaskBoardView = () => {
      const tasksByStatus = {
        'not-started': filteredTasks.filter(task => task.status === 'not-started'),
        'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
        'completed': filteredTasks.filter(task => task.status === 'completed')
      };

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 capitalize">
                  {status.replace('-', ' ')} ({statusTasks.length})
                </h3>
                <div className={`w-3 h-3 rounded-full ${
                  status === 'completed' ? 'bg-green-500' :
                  status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="space-y-3">
                {statusTasks.map((task) => (
                  <div key={task._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{task.description.substring(0, 80)}...</p>
                    
                    <div className="flex items-center justify-between">
                      {task.assignedTo ? (
                        <div className="flex items-center">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo.name)}&background=random`}
                            alt={task.assignedTo.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className="text-xs text-gray-700">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Unassigned</span>
                      )}
                      <span className="text-xs text-gray-500">{formatDate(task.dueDate)}</span>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
    );
  };
    
    // Main TasksTab component return
    return (
      <div className="space-y-6">
        {/* Task Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTaskView('list')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  taskView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setTaskView('board')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  taskView === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Board View
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  taskFilter === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('not-started')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  taskFilter === 'not-started' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Not Started ({tasks.filter(t => t.status === 'not-started').length})
              </button>
              <button
                onClick={() => setTaskFilter('in-progress')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  taskFilter === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Progress ({tasks.filter(t => t.status === 'in-progress').length})
              </button>
              <button
                onClick={() => setTaskFilter('completed')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  taskFilter === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed ({tasks.filter(t => t.status === 'completed').length})
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="btn-secondary text-sm">
              Export Tasks
            </button>
            <Link to={`/projects/${id}/tasks/create`} className="btn-primary text-sm">
              Add Task
            </Link>
          </div>
        </div>

        {/* Task View */}
        {taskView === 'list' ? <TaskListView /> : <TaskBoardView />}
      </div>
    );
  };

  const TeamTab = () => (
    <div className="space-y-6">
      {/* Team Management Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
          <p className="text-sm text-gray-600">Manage team members, roles, and permissions</p>
        </div>
        {hasPermission('canInviteMembers') && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="btn-primary text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{project.members.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">{project.members.filter(m => m.isActive).length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Supervisors</p>
              <p className="text-2xl font-bold text-gray-900">
                {project.members.filter(m => m.role === 'supervisor').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Productivity</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(project.members.reduce((acc, m) => acc + (m.user.productivity || 0), 0) / project.members.length)}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Role Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'supervisor', 'teamLead', 'teamMember'].map((role) => (
          <button
            key={role}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
              'all' === role 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {role === 'all' ? 'All Members' : 
             role === 'teamLead' ? 'Team Leads' :
             role === 'teamMember' ? 'Team Members' :
             'Supervisors'}
          </button>
        ))}
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h4 className="text-lg font-medium text-gray-900">Team Members</h4>
          {(project.userRole === 'supervisor' || project.userPermissions?.includes('canManageMembers')) && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="btn-primary text-sm"
            >
              Invite Member
            </button>
          )}
        </div>
        
        <div className="divide-y divide-gray-200">
          {project.members.map((member) => (
            <div key={member.user._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img 
                    src={member.user.avatar} 
                    alt={member.user.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{member.user.name}</h4>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                        {member.role.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {member.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">{member.user.productivity || 0}%</div>
                    <div className="text-xs text-gray-600">Productivity</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {tasks.filter(task => task.assignedTo?._id === member.user._id).length}
                    </div>
                    <div className="text-xs text-gray-600">Tasks</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600">{formatDate(member.joinedAt)}</div>
                    <div className="text-xs text-gray-600">Joined</div>
                  </div>
                  
                  {(project.userRole === 'supervisor' || project.userPermissions?.includes('canManageMembers')) && (
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-600 hover:text-blue-600 text-sm">
                        Edit
                      </button>
                      <button className="text-gray-600 hover:text-red-600 text-sm">
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {member.user.skills && member.user.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.user.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CommunicationTab = () => {
    const MessagesView = () => (
      <div className="space-y-6">
        {/* Discussion Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Project Discussions</h3>
            <p className="text-sm text-gray-600">Collaborate with your team through organized discussions</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowCreateDiscussion(true)}
              className="btn-primary text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Discussion
            </button>
          </div>
        </div>

        {/* Discussion Categories Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {['all', 'announcement', 'general', 'question', 'issue', 'suggestion'].map((category) => (
            <button
              key={category}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                'all' === category 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No discussions yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Start the conversation by creating a new discussion.
              </p>
            </div>
          ) : (
            discussions.map((discussion) => (
              <div key={discussion._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Discussion Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                          {discussion.title}
                        </h4>
                        {discussion.isPinned && (
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                            <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm8 4a1 1 0 011-1h3a1 1 0 110 2h-3a1 1 0 01-1-1z" clipRule="evenodd"/>
                          </svg>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          discussion.category === 'announcement' ? 'bg-red-100 text-red-800' :
                          discussion.category === 'question' ? 'bg-blue-100 text-blue-800' :
                          discussion.category === 'issue' ? 'bg-yellow-100 text-yellow-800' :
                          discussion.category === 'suggestion' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {discussion.category}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{discussion.content}</p>
                      
                      {/* Discussion Meta */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={discussion.author.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(discussion.author.name)}`}
                            alt={discussion.author.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span>{discussion.author.name}</span>
                        </div>
                        <span>{formatDate(discussion.createdAt)}</span>
                        <span>{discussion.views?.length || 0} views</span>
                        <span>{discussion.replies?.length || 0} replies</span>
                      </div>
                    </div>
                    
                    {/* Discussion Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleDiscussionLike(discussion._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          discussion.likes?.some(like => like.user === (currentUser._id || currentUser.id))
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                        </svg>
                      </button>
                      
                      {hasPermission('canModerateDiscussions') && (
                        <button
                          onClick={() => toggleDiscussionPin(discussion._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            discussion.isPinned
                              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Reply Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {/* Typing indicator for this discussion */}
                    <TypingIndicator room={`discussion_${discussion._id}`} />
                    
                    <div className="flex space-x-3">
                      <img 
                        src={currentUser.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}`}
                        alt="Your avatar"
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            // Handle typing events for real-time indicators
                            if (e.target.value.trim()) {
                              handleTyping(discussion._id, true);
                            } else {
                              handleTyping(discussion._id, false);
                            }
                          }}
                          onBlur={() => handleTyping(discussion._id, false)}
                          placeholder="Add a reply..."
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => addReply(discussion._id, newMessage)}
                            disabled={!newMessage.trim()}
                            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Replies Preview */}
                  {discussion.replies && discussion.replies.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {discussion.replies.slice(-2).map((reply) => (
                        <div key={reply._id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                          <img 
                            src={reply.author.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author.name)}`}
                            alt={reply.author.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">{reply.author.name}</span>
                              <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-700">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                      {discussion.replies.length > 2 && (
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          View all {discussion.replies.length} replies
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );

    const FilesView = () => (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Project Files</h3>
          {(project.userRole === 'supervisor' || project.userPermissions?.includes('canManageFiles')) && (
            <button 
              onClick={() => setShowFileUploader(true)}
              className="btn-primary text-sm"
            >
              Upload File
            </button>
          )}
        </div>
        
        {projectFiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload files to share with your team.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {projectFiles.map((file) => (
              <div key={file.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded ${
                      file.contentType?.includes('image') ? 'bg-blue-100' :
                      file.contentType?.includes('pdf') ? 'bg-red-100' :
                      file.contentType?.includes('document') ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{file.filename}</h4>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded by {file.uploadedBy.name} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleFileDownload(file.key)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Download
                    </button>
                    {(project.userRole === 'supervisor' || file.uploadedBy.id === currentUser?.id) && (
                      <button 
                        onClick={() => handleFileDelete(file.key)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    const SettingsView = () => (
      <div className="space-y-6">
        {/* Notification Settings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
          <NotificationSettings
            preferences={notificationPreferences}
            onUpdatePreferences={updateNotificationPreferences}
          />
        </div>

        {/* Connection Manager Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Management</h3>
          <ConnectionManager
            isConnected={isConnected}
            connectionError={connectionError}
            lastConnectedTime={lastConnectedTime}
            reconnectionAttempts={reconnectionAttempts}
            onManualReconnect={handleManualReconnect}
            onForceDisconnect={handleForceDisconnect}
          />
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Communication Sub-tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {communicationSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSubTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Sub-tab Content */}
        {activeSubTab === 'messages' && <MessagesView />}
        {activeSubTab === 'files' && <FilesView />}
        {activeSubTab === 'settings' && <SettingsView />}
      </div>
    );
  };

  const AnalyticsTab = () => (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((project.taskStats.completed / project.taskStats.total) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Time Delivery</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Velocity</p>
              <p className="text-2xl font-bold text-gray-900">8.5</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Team Productivity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Team Productivity</h3>
          <button className="btn-secondary text-sm">Export Report</button>
        </div>
        
        <div className="space-y-4">
          {project.analytics.teamProductivity.map((member) => (
            <div key={member.member} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.member)}&background=random`}
                  alt={member.member}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{member.member}</h4>
                  <p className="text-sm text-gray-600">{member.tasksCompleted} tasks completed</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{member.productivity}%</div>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${member.productivity}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Task Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {project.analytics.taskDistribution.map((item) => (
            <div key={item.status} className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: item.color }}
              >
                {item.count}
              </div>
              <h4 className="text-sm font-medium text-gray-900">{item.status}</h4>
              <p className="text-xs text-gray-600">
                {Math.round((item.count / project.taskStats.total) * 100)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to PDF
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4V2m8 2V2m-8 8h8m-8 4h8" />
            </svg>
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );

  // Testing Tab Component for Role-Based Access Control
  const TestingTab = () => (
    <div className="space-y-6">
      {/* Testing Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Role-Based Access Control Testing</h2>
            <p className="mt-2 text-purple-100">
              Comprehensive test suite for validating role-based permissions and access controls
            </p>
          </div>
          <div className="text-6xl opacity-20">
            🧪
          </div>
        </div>
      </div>

      {/* Current User Role Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Testing Context</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentUser?.role === 'supervisor' ? 'bg-purple-100 text-purple-800' :
            currentUser?.role === 'teamLead' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {currentUser?.role || 'teamMember'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Project Role</h4>
            <p className="text-sm text-gray-600 mt-1">{project?.userRole || 'teamMember'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">User ID</h4>
            <p className="text-sm text-gray-600 mt-1">{currentUser?.id || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Project ID</h4>
            <p className="text-sm text-gray-600 mt-1">{project?.id || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Role-Based Test Suite Component */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Automated Permission Tests</h3>
          <p className="text-sm text-gray-600 mt-1">
            Execute comprehensive tests to validate role-based access control across all features
          </p>
        </div>
        
        <div className="p-6">
          <RoleBasedTestSuite 
            projectId={project?.id}
            currentUser={currentUser}
            project={project}
            onRoleChange={(newRole) => {
              // Update current user role for testing
              setCurrentUser(prev => ({ ...prev, role: newRole }));
              // Optionally update project user role
              setProject(prev => ({ ...prev, userRole: newRole }));
              toast.success(`Role switched to: ${newRole}`);
            }}
          />
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Testing Instructions</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use the role switcher to test different permission levels</li>
                <li>Execute individual test categories to validate specific features</li>
                <li>Run the complete test suite to validate all 18+ permission scenarios</li>
                <li>Check the console for detailed test results and error logs</li>
                <li>Test tab access restrictions by switching roles and navigating</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the project data once loaded
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
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

  // Determine if user has edit permissions
  const canEdit = currentUser && (
    project.userRole === 'supervisor' ||
    project.userPermissions?.includes('canEditProject') ||
    project.userPermissions?.includes('canManageMembers')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <Link to="/projects" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">
                Projects
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{project.title}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{project.title}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priorityLevel)}`}>
                  {project.priorityLevel.charAt(0).toUpperCase() + project.priorityLevel.slice(1)} Priority
                </span>
                {/* Real-time online users indicator */}
                <OnlineUsersIndicator room={`project_${project._id || project.id}`} />
                
                {/* Connection status indicator */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <p className="mt-2 text-gray-600 text-sm max-w-4xl">{project.description}</p>
              
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(project.startDate)} - {formatDate(project.deadline)}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {project.members.length} team members
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {project.progress}% complete
                </div>
              </div>
            </div>
            
            {canEdit && (
              <div className="mt-4 lg:mt-0 lg:ml-4 flex flex-col sm:flex-row gap-3">
                <Link 
                  to={`/projects/${project._id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Edit Project
                </Link>
                <button 
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Delete Project
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Project Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {getAccessibleTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'tasks' && <TasksTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'communication' && <CommunicationTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'testing' && <TestingTab />}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Project</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this project? This action cannot be undone and will permanently remove all project data, tasks, and files.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="team-member">Team Member</option>
                    <option value="team-lead">Team Lead</option>
                    {project.userRole === 'supervisor' && <option value="supervisor">Supervisor</option>}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteMember}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUploader && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Project Files</h3>
              <FileUploader 
                projectId={id}
                onUpload={handleFileUpload}
                onClose={() => setShowFileUploader(false)}
                multiple={true}
                maxSize={50}
                allowedTypes="pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif"
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Discussion Modal */}
      {showCreateDiscussion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Discussion</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                createDiscussion({
                  title: formData.get('title'),
                  content: formData.get('content'),
                  category: formData.get('category')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter discussion title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      {hasPermission('canCreateAnnouncements') && <option value="announcement">Announcement</option>}
                      <option value="question">Question</option>
                      <option value="issue">Issue</option>
                      <option value="suggestion">Suggestion</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      name="content"
                      required
                      rows="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Enter discussion content"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateDiscussion(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Create Discussion
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
