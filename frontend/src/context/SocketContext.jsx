import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext();

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

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5500', {
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
    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title || 'New Notification', {
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
    typingUsers,
    joinProject,
    leaveProject,
    sendTaskUpdate,
    sendDiscussionMessage,
    sendProjectUpdate,
    startTyping,
    stopTyping,
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
