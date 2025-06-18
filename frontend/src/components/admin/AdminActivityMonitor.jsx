import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';

const AdminActivityMonitor = ({ isConnected }) => {
  const [activities, setActivities] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('activity');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    setActivities([
      {
        id: 1,
        type: 'user_login',
        user: 'John Doe',
        action: 'logged in',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        details: 'Successfully authenticated from IP 192.168.1.100',
        severity: 'info'
      },
      {
        id: 2,
        type: 'project_created',
        user: 'Jane Smith',
        action: 'created new project',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        details: 'Project "TaskNest Mobile App" created',
        severity: 'success'
      },
      {
        id: 3,
        type: 'user_role_changed',
        user: 'Admin',
        action: 'changed user role',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        details: 'Changed Robert Brown from user to admin',
        severity: 'warning'
      },
      {
        id: 4,
        type: 'task_completed',
        user: 'Sarah Wilson',
        action: 'completed task',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        details: 'Task "Database optimization" marked as complete',
        severity: 'success'
      },
      {
        id: 5,
        type: 'system_backup',
        user: 'System',
        action: 'backup completed',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        details: 'Automated database backup successful (2.4GB)',
        severity: 'info'
      }
    ]);

    setSystemLogs([
      {
        id: 1,
        level: 'INFO',
        message: 'Database connection pool initialized successfully',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        service: 'Database'
      },
      {
        id: 2,
        level: 'WARN',
        message: 'High memory usage detected: 85% of available RAM',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        service: 'System Monitor'
      },
      {
        id: 3,
        level: 'INFO',
        message: 'User authentication service restarted',
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        service: 'Auth Service'
      },
      {
        id: 4,
        level: 'ERROR',
        message: 'Failed to send email notification to user@example.com',
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
        service: 'Email Service'
      },
      {
        id: 5,
        level: 'INFO',
        message: 'Scheduled task cleanup completed, removed 247 old records',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        service: 'Task Scheduler'
      }
    ]);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate new activity
      const newActivity = {
        id: Date.now(),
        type: 'auto_generated',
        user: 'System Monitor',
        action: 'status update',
        timestamp: new Date(),
        details: 'Automated system health check completed',
        severity: 'info'
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
    }, 30000); // Add new activity every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      case 'WARN':
        return 'text-yellow-600 bg-yellow-50';
      case 'INFO':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_login':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'project_created':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'user_role_changed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'task_completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">System Activity Monitor</h3>
            <p className="text-sm text-gray-600">Real-time system events and logs</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Activity
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              System Logs
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'activity' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${getSeverityColor(activity.severity)}`}></div>
                <div className="flex-shrink-0 p-2 bg-white rounded-full shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      <span className="font-semibold">{activity.user}</span> {activity.action}
                    </p>
                    <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {systemLogs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLogLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{log.service}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTimeAgo(log.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-800 font-mono bg-white p-2 rounded border">
                  {log.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {activeTab === 'activity' ? activities.length : systemLogs.length} recent {activeTab === 'activity' ? 'activities' : 'log entries'}
          </div>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            View Full {activeTab === 'activity' ? 'Activity' : 'Log'} History
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityMonitor;
