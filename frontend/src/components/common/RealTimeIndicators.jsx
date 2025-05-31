import React from 'react';
import { UserIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../context/SocketContext';

const OnlineUsersIndicator = ({ projectId }) => {
  const { onlineUsers, isConnected } = useSocket();

  // Filter online users for the current project
  const projectOnlineUsers = onlineUsers.filter(user => 
    user.projects && user.projects.includes(projectId)
  );

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm">Disconnected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600">Online</span>
      </div>

      {/* Online Users Count */}
      {projectOnlineUsers.length > 0 && (
        <div className="flex items-center space-x-2">
          <UserIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {projectOnlineUsers.length} online
          </span>
        </div>
      )}

      {/* Online Users Avatars */}
      {projectOnlineUsers.length > 0 && (
        <div className="flex -space-x-2">
          {projectOnlineUsers.slice(0, 5).map((user) => (
            <div
              key={user.userId}
              className="relative"
              title={user.userName}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                {user.userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          ))}
          {projectOnlineUsers.length > 5 && (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
              +{projectOnlineUsers.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TypingIndicator = ({ discussionId }) => {
  const { typingUsers } = useSocket();
  const discussionTypingUsers = typingUsers[discussionId] || {};
  const typingUsersList = Object.values(discussionTypingUsers);

  if (typingUsersList.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0].userName} is typing...`;
    } else if (typingUsersList.length === 2) {
      return `${typingUsersList[0].userName} and ${typingUsersList[1].userName} are typing...`;
    } else {
      return `${typingUsersList[0].userName} and ${typingUsersList.length - 1} others are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 text-gray-500 text-sm">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="italic">{getTypingText()}</span>
    </div>
  );
};

const ConnectionStatus = () => {
  const { isConnected } = useSocket();

  return (
    <div className={`fixed bottom-4 right-4 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      isConnected 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}></div>
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};

const LastSeen = ({ timestamp }) => {
  const formatLastSeen = (date) => {
    const now = new Date();
    const lastSeen = new Date(date);
    const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="flex items-center space-x-1 text-xs text-gray-400">
      <ClockIcon className="h-3 w-3" />
      <span>{formatLastSeen(timestamp)}</span>
    </div>
  );
};

export { OnlineUsersIndicator, TypingIndicator, ConnectionStatus, LastSeen };
