import React, { useState, useEffect, useRef, useContext } from 'react';
import { toast } from 'react-toastify';
import projectService from '../../../services/projectService';
import { SocketContext } from '../../../context/SocketContext';

const CommunicationWidget = ({ 
  discussions = [], 
  project, 
  currentUser, 
  userRole, 
  permissions = {},
  onMessageSend,
  onDiscussionCreate,
  className 
}) => {
  const { socket } = useContext(SocketContext) || {};
  const [activeTab, setActiveTab] = useState('discussions');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activityFeed, setActivityFeed] = useState([
    { id: 1, type: 'task_update', message: 'Task "Homepage Design" was completed', time: '2 hours ago', user: 'John Doe' },
    { id: 2, type: 'member_join', message: 'Sarah Wilson joined the project', time: '4 hours ago', user: 'System' },
    { id: 3, type: 'file_upload', message: 'New file "requirements.pdf" uploaded', time: '6 hours ago', user: 'Mike Chen' },
    { id: 4, type: 'milestone', message: 'Milestone "Beta Release" reached', time: '1 day ago', user: 'System' }
  ]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load data on component mount
  useEffect(() => {
    if (project?._id) {
      loadMessages();
      loadActivity();
      joinProjectRoom();
    }

    return () => {
      if (socket && project?._id) {
        socket.emit('leave_project', project._id);
      }
    };
  }, [project?._id, socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !project?._id) return;

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleTypingStart = (data) => {
      if (data.userId !== currentUser?._id) {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
      }
    };

    const handleTypingStop = (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    const handleUserOnline = (users) => {
      setOnlineUsers(users);
    };

    const handleNewActivity = (activity) => {
      setActivityFeed(prev => [activity, ...prev]);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('users_online', handleUserOnline);
    socket.on('project_activity', handleNewActivity);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('users_online', handleUserOnline);
      socket.off('project_activity', handleNewActivity);
    };
  }, [socket, project?._id, currentUser?._id]);

  const joinProjectRoom = () => {
    if (socket && project?._id) {
      socket.emit('join_project', {
        projectId: project._id,
        userId: currentUser?._id,
        userInfo: {
          name: currentUser?.name,
          avatar: currentUser?.avatar
        }
      });
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await projectService.getMessages(project._id);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Fallback to mock data
      setMessages([
        { id: 1, content: 'Welcome to the project chat!', author: { name: 'System' }, timestamp: new Date().toISOString() },
        { id: 2, content: 'Looking forward to working with everyone', author: { name: 'John Doe' }, timestamp: new Date().toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      setLoadingActivity(true);
      const response = await projectService.getProjectActivity(project._id);
      setActivityFeed(response.data || activityFeed);
    } catch (error) {
      console.error('Failed to load activity:', error);
      // Keep fallback data already set in state
    } finally {
      setLoadingActivity(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    if (!permissions?.canCreateDiscussion) {
      toast.error('You do not have permission to create discussions');
      return;
    }

    setLoading(true);
    try {
      const response = await projectService.createDiscussion(project._id, {
        title: newDiscussion.title,
        content: newDiscussion.content
      });

      if (response.success) {
        const discussion = response.data;
        onDiscussionCreate?.(discussion);
        setNewDiscussion({ title: '', content: '' });
        setShowNewDiscussion(false);
        toast.success('Discussion created successfully');
      } else {
        toast.error(response.message || 'Failed to create discussion');
      }
    } catch (error) {
      console.error('Failed to create discussion:', error);
      toast.error(error.response?.data?.message || 'Failed to create discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!permissions?.canSendMessage) {
      toast.error('You do not have permission to send messages');
      return;
    }

    try {
      const response = await projectService.sendMessage(project._id, {
        content: newMessage,
        type: 'text'
      });

      if (response.success) {
        const message = response.data;
        setMessages(prev => [...prev, message]);
        onMessageSend?.(message);
        setNewMessage('');
        handleStopTyping();
        
        // Emit via socket for real-time updates
        if (socket) {
          socket.emit('send_message', {
            projectId: project._id,
            message: message
          });
        }
      } else {
        toast.error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleStartTyping = () => {
    if (socket && project?._id && currentUser?._id) {
      socket.emit('typing_start', {
        projectId: project._id,
        userId: currentUser._id,
        userName: currentUser.name
      });

      // Clear existing timeout and set new one
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 3000);
    }
  };

  const handleStopTyping = () => {
    if (socket && project?._id && currentUser?._id) {
      socket.emit('typing_stop', {
        projectId: project._id,
        userId: currentUser._id
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleMessageInputChange = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim() && !typingTimeoutRef.current) {
      handleStartTyping();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_update':
        return (
          <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-4h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4h6" />
          </svg>
        );
      case 'member_join':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'file_upload':
        return (
          <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'milestone':
        return (
          <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const renderDiscussions = () => (
    <div className="space-y-4">
      {/* New Discussion Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Discussions ({discussions.length})
        </h3>
        {permissions?.canCreateDiscussion && (
          <button
            onClick={() => setShowNewDiscussion(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
          >
            New Discussion
          </button>
        )}
      </div>

      {/* New Discussion Form */}
      {showNewDiscussion && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Discussion title"
              value={newDiscussion.title}
              onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <textarea
              placeholder="Start the discussion..."
              value={newDiscussion.content}
              onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewDiscussion(false)}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDiscussion}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded-md text-sm font-medium"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discussions List */}
      <div className="space-y-3">
        {discussions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No discussions yet</p>
            <p className="text-sm">Start a conversation to collaborate with your team</p>
          </div>
        ) : (
          discussions.map((discussion) => (
            <div key={discussion.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{discussion.title}</h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">{discussion.createdAt}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{discussion.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>By {discussion.author?.name}</span>
                  <span>{discussion.replies?.length || 0} replies</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  View Discussion
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="flex flex-col h-full">
      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700 dark:text-green-300">
              {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ maxHeight: '300px' }}>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {message.author?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {message.author?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {typingUsers.map(user => user.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Message Input */}
      {(permissions?.canSendMessage !== false) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleMessageInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Activity
      </h3>
      
      {loadingActivity ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : activityFeed.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-4h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4h6" />
          </svg>
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activityFeed.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </span>
                  {activity.user !== 'System' && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      by {activity.user}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className || ''}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Communication Hub
        </h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'discussions', label: 'Discussions', count: discussions.length },
            { key: 'messages', label: 'Messages', count: messages.length },
            { key: 'activity', label: 'Activity', count: activityFeed.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'discussions' && renderDiscussions()}
        {activeTab === 'messages' && renderMessages()}
        {activeTab === 'activity' && renderActivity()}
      </div>
    </div>
  );
};

export default CommunicationWidget;
