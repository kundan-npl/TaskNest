import React from 'react';
import { toast } from 'react-toastify';

const NotificationSettings = ({ 
  preferences, 
  onUpdatePreference, 
  onClose,
  connectionStatus = null
}) => {
  const settingsConfig = [
    {
      key: 'taskUpdates',
      title: 'Task Updates',
      description: 'Receive notifications when tasks are created, updated, or completed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      key: 'projectUpdates',
      title: 'Project Updates',
      description: 'Get notified about project status changes, new members, and milestones',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      key: 'newMessages',
      title: 'New Messages',
      description: 'Be notified when someone replies to discussions or mentions you',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      key: 'mentions',
      title: 'Mentions',
      description: 'Get instant notifications when someone mentions you in comments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      key: 'deadlineReminders',
      title: 'Deadline Reminders',
      description: 'Receive alerts for upcoming task deadlines and overdue items',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      key: 'realTimeIndicators',
      title: 'Real-time Indicators',
      description: 'Show typing indicators, online status, and live updates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  const handlePreferenceToggle = (key) => {
    const newValue = !preferences[key];
    onUpdatePreference(key, newValue);
    
    // Provide contextual feedback
    const setting = settingsConfig.find(s => s.key === key);
    if (setting) {
      toast.success(
        `${setting.title} ${newValue ? 'enabled' : 'disabled'}`, 
        { 
          position: 'bottom-right',
          autoClose: 2000
        }
      );
    }
  };

  const enableAll = () => {
    settingsConfig.forEach(setting => {
      if (!preferences[setting.key]) {
        onUpdatePreference(setting.key, true);
      }
    });
    toast.success('All notifications enabled', { position: 'bottom-right' });
  };

  const disableAll = () => {
    settingsConfig.forEach(setting => {
      if (preferences[setting.key]) {
        onUpdatePreference(setting.key, false);
      }
    });
    toast.success('All notifications disabled', { position: 'bottom-right' });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM5 12V7a5 5 0 1110 0v5l-5 5-5-5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
            <p className="text-sm text-gray-600">Customize your real-time notification settings</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className={`mb-6 p-3 rounded-lg border ${
          connectionStatus.isConnected 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              connectionStatus.isConnected ? 'text-green-800' : 'text-red-800'
            }`}>
              {connectionStatus.isConnected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}
            </span>
          </div>
          {!connectionStatus.isConnected && connectionStatus.reconnectionAttempts > 0 && (
            <p className="text-xs text-red-600 mt-1">
              Reconnection attempts: {connectionStatus.reconnectionAttempts}
            </p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={enableAll}
          className="flex-1 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
        >
          Enable All
        </button>
        <button
          onClick={disableAll}
          className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-colors"
        >
          Disable All
        </button>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4">
        {settingsConfig.map((setting) => (
          <div key={setting.key} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 mt-1">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                {setting.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{setting.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences[setting.key] || false}
                    onChange={() => handlePreferenceToggle(setting.key)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {Object.values(preferences).filter(Boolean).length} of {settingsConfig.length} notifications enabled
          </span>
          <span className="text-xs">
            Settings are saved automatically and synced across devices
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
