import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext();

export { SocketContext };

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [dashboardData, setDashboardData] = useState({});
  const [lastDashboardUpdate, setLastDashboardUpdate] = useState(null);
  const { user, token } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (user && token) {
      initializeSocket();
    } else if (socket) {
      disconnectSocket();
    }

    return () => {
      if (socket) {
        disconnectSocket();
      }
    };
  }, [user, token]);

  const initializeSocket = () => {
    if (socket) {
      disconnectSocket();
    }

    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: maxReconnectAttempts
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
      setOnlineUsers([]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        newSocket.disconnect();
      } else {
        reconnectAttempts.current += 1;
      }
    });

    // Real-time event handlers
    newSocket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      window.dispatchEvent(new CustomEvent('notification', { detail: { notification, projectId: notification.projectId } }));
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title || 'New Notification', {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });
    newSocket.on('project_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      window.dispatchEvent(new CustomEvent('notification', { detail: { notification, projectId: notification.projectId } }));
      if (Notification.permission === 'granted') {
        new Notification(notification.title || 'Project Notification', {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    newSocket.on('taskUpdated', (data) => {
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('taskUpdated', { detail: data }));
    });

    newSocket.on('newDiscussionMessage', (data) => {
      // Emit custom event for discussion components
      window.dispatchEvent(new CustomEvent('newDiscussionMessage', { detail: data }));
    });

    newSocket.on('projectUpdated', (data) => {
      // Emit custom event for project components
      window.dispatchEvent(new CustomEvent('projectUpdated', { detail: data }));
    });

    newSocket.on('userJoinedProject', (data) => {
      setOnlineUsers(data.onlineUsers || []);
    });

    newSocket.on('userLeftProject', (data) => {
      setOnlineUsers(data.onlineUsers || []);
    });

    newSocket.on('userTyping', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.discussionId]: {
          ...prev[data.discussionId],
          [data.userId]: {
            userName: data.userName,
            timestamp: Date.now()
          }
        }
      }));

      // Remove typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const newState = { ...prev };
          if (newState[data.discussionId]) {
            delete newState[data.discussionId][data.userId];
            if (Object.keys(newState[data.discussionId]).length === 0) {
              delete newState[data.discussionId];
            }
          }
          return newState;
        });
      }, 3000);
    });

    newSocket.on('userStoppedTyping', (data) => {
      setTypingUsers(prev => {
        const newState = { ...prev };
        if (newState[data.discussionId]) {
          delete newState[data.discussionId][data.userId];
          if (Object.keys(newState[data.discussionId]).length === 0) {
            delete newState[data.discussionId];
          }
        }
        return newState;
      });
    });

    // Dashboard-specific event handlers
    newSocket.on('dashboard_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        [data.type]: data.data
      }));
      setLastDashboardUpdate(new Date());
      
      // Emit custom event for dashboard components
      window.dispatchEvent(new CustomEvent('dashboardUpdate', { 
        detail: { type: data.type, data: data.data } 
      }));
    });

    newSocket.on('task_stats_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        taskStats: data.stats
      }));
      
      window.dispatchEvent(new CustomEvent('taskStatsUpdate', { detail: data.stats }));
    });

    newSocket.on('project_stats_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        projectStats: data.stats
      }));
      
      window.dispatchEvent(new CustomEvent('projectStatsUpdate', { detail: data }));
    });

    newSocket.on('system_stats_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        systemStats: data.stats
      }));
      
      window.dispatchEvent(new CustomEvent('systemStatsUpdate', { detail: data.stats }));
    });

    newSocket.on('activity_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        activityFeed: prev.activityFeed ? [data.activity, ...prev.activityFeed.slice(0, 19)] : [data.activity]
      }));
      
      window.dispatchEvent(new CustomEvent('activityUpdate', { detail: data.activity }));
    });

    newSocket.on('performance_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        performanceMetrics: data.metrics
      }));
      
      window.dispatchEvent(new CustomEvent('performanceUpdate', { detail: data.metrics }));
    });

    newSocket.on('dashboard_refresh_requested', () => {
      window.dispatchEvent(new CustomEvent('dashboardRefreshRequested'));
    });

    // Task and project real-time events
    newSocket.on('task_status_changed', (data) => {
      window.dispatchEvent(new CustomEvent('task_status_changed', { detail: data }));
    });

    newSocket.on('new_task_comment', (data) => {
      window.dispatchEvent(new CustomEvent('new_task_comment', { detail: data }));
    });

    newSocket.on('member_update', (data) => {
      window.dispatchEvent(new CustomEvent('member_update', { detail: data }));
    });

    newSocket.on('project_notification', (data) => {
      window.dispatchEvent(new CustomEvent('project_notification', { detail: data }));
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers({});
    }
  };

  // Socket methods
  const joinProject = (projectId) => {
    if (socket && isConnected) {
      socket.emit('joinProject', projectId);
    }
  };

  const leaveProject = (projectId) => {
    if (socket && isConnected) {
      socket.emit('leaveProject', projectId);
    }
  };

  const sendTaskUpdate = (taskData) => {
    if (socket && isConnected) {
      socket.emit('taskUpdate', taskData);
    }
  };

  const sendDiscussionMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('discussionMessage', messageData);
    }
  };

  const sendProjectUpdate = (projectData) => {
    if (socket && isConnected) {
      socket.emit('projectUpdate', projectData);
    }
  };

  const startTyping = (discussionId) => {
    if (socket && isConnected) {
      socket.emit('typing', { discussionId });
    }
  };

  const stopTyping = (discussionId) => {
    if (socket && isConnected) {
      socket.emit('stopTyping', { discussionId });
    }
  };

  // Dashboard-specific methods
  const joinDashboard = () => {
    if (socket && isConnected) {
      socket.emit('join_dashboard');
    }
  };

  const leaveDashboard = () => {
    if (socket && isConnected) {
      socket.emit('leave_dashboard');
    }
  };

  const refreshDashboard = () => {
    if (socket && isConnected) {
      socket.emit('refresh_dashboard');
    }
  };

  const trackDashboardActivity = (activity) => {
    if (socket && isConnected) {
      socket.emit('dashboard_activity', {
        ...activity,
        timestamp: new Date().toISOString()
      });
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
    setNotifications, // <-- add this
    typingUsers,
    dashboardData,
    lastDashboardUpdate,
    joinProject,
    leaveProject,
    sendTaskUpdate,
    sendDiscussionMessage,
    sendProjectUpdate,
    startTyping,
    stopTyping,
    joinDashboard,
    leaveDashboard,
    refreshDashboard,
    trackDashboardActivity,
    markNotificationAsRead,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
