import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import projectService from '../../../services/projectService';
import { formatDistanceToNow } from '../../../utils/dateUtils';
import { useSocket } from '../../../context/SocketContext';

const NotificationWidget = ({ 
  notifications: propNotifications = [], 
  project,
  userRole,
  permissions = {},
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onPreferences,
  className 
}) => {
  const [notifications, setNotifications] = useState(propNotifications);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'high', 'medium', 'low'
  const [showPreferences, setShowPreferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiCallsInProgress, setApiCallsInProgress] = useState(new Set());
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskUpdates: true,
    milestoneReminders: true,
    teamMessages: true,
    projectUpdates: true,
    weeklyDigest: true,
    urgentOnly: false,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00'
  });

  const { socket, isConnected, notifications: socketNotifications, setNotifications: setContextNotifications } = useSocket();  // Load project notifications with debouncing
  const loadProjectNotifications = useCallback(async () => {
    if (!project?._id && !project?.id) return;
    
    try {
      setLoading(true);
      const response = await projectService.getProjectNotifications(project._id || project.id);
      if (response.success) {
        setNotifications(response.data || []);
        if (setContextNotifications) setContextNotifications(response.data || []); // keep context in sync
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Check if it's a rate limit error (429)
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        console.warn('Rate limited, using fallback data');
        // Don't show error toast for rate limiting - just use existing data
        return;
      }
      // Fallback to mock data for other errors
      const mockNotifications = [
        {
          id: 1,
          type: 'task',
          title: 'Task Assigned',
          message: 'You have been assigned to "Homepage Design"',
          priority: 'high',
          isRead: false,
          createdAt: '2024-01-15T10:30:00Z',
          project: project.name
        },
        {
          id: 2,
          type: 'milestone',
          title: 'Milestone Due Soon',
          message: 'Beta Release milestone is due in 2 days',
          priority: 'high',
          isRead: false,
          createdAt: '2024-01-15T09:15:00Z',
          project: project.name
        },
        {
          id: 3,
          type: 'team',
          title: 'New Team Member',
          message: 'Sarah Wilson joined the project',
          priority: 'medium',
          isRead: true,
          createdAt: '2024-01-14T16:45:00Z',
          project: project.name
        }
      ];
      setNotifications(mockNotifications);
      if (setContextNotifications) setContextNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  }, [project?._id, project?.id, setContextNotifications]);

  const loadNotificationStats = useCallback(async () => {
    if (!project?._id && !project?.id) return;
    
    try {
      const response = await projectService.getProjectNotificationStats(project._id || project.id);
      if (response.success) {
        // Don't set stats here since we're using computed stats
        // setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load notification stats:', error);
      // Don't show error for rate limiting
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        return;
      }
    }
  }, [project?._id, project?.id]);

  const loadNotificationPreferences = useCallback(async () => {
    try {
      if (!project?._id && !project?.id) return;
      const response = await projectService.getProjectNotificationPreferences(project._id || project.id);
      if (response.success) {
        setPreferences(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      // Don't show error for rate limiting
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        return;
      }
    }
  }, [project?._id, project?.id]);

  // Update local state from props only when project changes (prevents feedback loop)
  useEffect(() => {
    setNotifications(propNotifications);
  }, [project?._id, project?.id]);

  // Load project notifications with debouncing to prevent rate limiting
  useEffect(() => {
    let timeoutId;
    // Only run if project id is available
    if (project?._id || project?.id) {
      timeoutId = setTimeout(() => {
        // Use functional updates to avoid stale closures and infinite loops
        loadProjectNotifications();
        loadNotificationStats();
        loadNotificationPreferences();
      }, 300);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // Only run when project id changes, not on every render or loader recreation
  }, [project?._id, project?.id]);

  // Calculate stats directly using useMemo to prevent unnecessary recalculations
  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    high: notifications.filter(n => n.priority === 'high').length,
    medium: notifications.filter(n => n.priority === 'medium').length,
    low: notifications.filter(n => n.priority === 'low').length
  }), [notifications]);

  // Real-time notification updates via Socket.IO
  useEffect(() => {
    const handleNewNotification = (event) => {
      const { notification, projectId } = event.detail;
      
      // Only add if it's for the current project or global
      if (!projectId || projectId === (project?._id || project?.id)) {
        setNotifications(prev => [notification, ...prev]);
        
        // Show toast for important notifications
        if (notification.priority === 'high') {
          toast.warning(notification.message);
        }
      }
    };

    // Listen for notifications via custom events from SocketContext
    window.addEventListener('notification', handleNewNotification);

    return () => {
      window.removeEventListener('notification', handleNewNotification);
    };
  }, [project?._id, project?.id]); // Removed notifications dependency to prevent infinite loop

  // Sync with socket notifications from context
  useEffect(() => {
    if (socketNotifications && socketNotifications.length > 0) {
      // Filter for project-specific notifications
      const projectNotifications = socketNotifications.filter(n =>
        !n.projectId || n.projectId === (project?._id || project?.id)
      );
      
      if (projectNotifications.length > 0) {
        setNotifications(prev => {
          const existingIds = prev.map(n => n._id);
          const newNotifications = projectNotifications.filter(n => !existingIds.includes(n._id));
          if (newNotifications.length > 0) {
            return [...newNotifications, ...prev];
          }
          return prev;
        });
      }
    }
  }, [socketNotifications, project?._id, project?.id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await projectService.markProjectNotificationsAsRead(
        project._id || project.id, 
        [notificationId]
      );
      
      if (response.success) {
        setNotifications(prev => {
          return prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
        });
        onMarkAsRead?.(notificationId);
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      const response = await projectService.markProjectNotificationsAsRead(
        project._id || project.id,
        unreadIds
      );
      
      if (response.success) {
        setNotifications(prev => {
          return prev.map(n => ({ ...n, isRead: true }));
        });
        onMarkAllAsRead?.();
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      // Note: You might want to add a delete API endpoint
      setNotifications(prev => {
        return prev.filter(n => n.id !== notificationId);
      });
      onDeleteNotification?.(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleUpdatePreferences = async (newPreferences) => {
    try {
      const response = await projectService.updateProjectNotificationPreferences(
        project._id || project.id,
        newPreferences
      );
      
      if (response.success) {
        setPreferences(newPreferences);
        onPreferences?.(newPreferences);
        toast.success('Notification preferences updated');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update notification preferences');
    }
  };

  const handleSavePreferences = async () => {
    await handleUpdatePreferences(preferences);
    setShowPreferences(false);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.priority === filter;
  });

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    // Show time in HH:mm format if today, else show date
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      low: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    };
    
    return colors[priority] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task':
        return (
          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-4h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4h6" />
          </svg>
        );
      case 'milestone':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'team':
        return (
          <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'deadline':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.882 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'mention':
        return (
          <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM11 21H5a2 2 0 01-2-2V5a2 2 0 012-2h6l4 4v4.5" />
          </svg>
        );
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`widget-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <div className="relative">
              <svg className="h-5 w-5 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM11 21H5a2 2 0 01-2-2V5a2 2 0 012-2h6l4 4v4.5" />
              </svg>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unreadCount} unread • {notifications.length} total
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Mark all read
            </button>
          )}
          
          <button
            onClick={() => setShowPreferences(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {[
          { value: 'all', label: 'All', count: notifications.length },
          { value: 'unread', label: 'Unread', count: unreadCount },
          { value: 'high', label: 'High Priority', count: notifications.filter(n => n.priority === 'high').length }
        ].map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              filter === value
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {label} {count > 0 && <span className="ml-1">({count})</span>}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM11 21H5a2 2 0 01-2-2V5a2 2 0 012-2h6l4 4v4.5" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications.`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-l-4 p-4 rounded-r-lg transition-all ${
                notification.read ? 'opacity-60' : ''
              } ${getPriorityColor(notification.priority)} hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`text-sm font-medium ${
                        notification.read 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      notification.read 
                        ? 'text-gray-500 dark:text-gray-500' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(notification.createdAt)}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Notification Preferences
              </h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Delivery Methods</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Push notifications</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Notification Types</h4>
                <div className="space-y-2">
                  {[
                    { key: 'taskUpdates', label: 'Task updates and assignments' },
                    { key: 'milestoneReminders', label: 'Milestone reminders' },
                    { key: 'teamMessages', label: 'Team messages and mentions' },
                    { key: 'projectUpdates', label: 'Project status updates' },
                    { key: 'weeklyDigest', label: 'Weekly digest emails' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences[key]}
                        onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationWidget;
