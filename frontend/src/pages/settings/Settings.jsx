import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';

const Settings = () => {
  const { currentUser, hasRole } = useAuth();
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskAssignments: true,
    taskUpdates: true,
    projectUpdates: true,
    mentions: true,
    reminders: true
  });
  
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY'
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleAppSettingChange = (e) => {
    const { name, value } = e.target;
    setAppSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveNotificationSettings = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // In a real implementation, we would call the API
      // await userService.updateNotificationSettings(notificationSettings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Notification settings saved successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };
  
  const saveAppSettings = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // In a real implementation, we would call the API
      // await userService.updateAppSettings(appSettings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Application settings saved successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to save application settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
            
            <form onSubmit={saveNotificationSettings}>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailNotifications"
                      name="emailNotifications"
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      checked={notificationSettings.emailNotifications}
                      onChange={handleNotificationChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailNotifications" className="font-medium text-gray-700">Email Notifications</label>
                    <p className="text-gray-500">Receive email notifications for important events</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="taskAssignments"
                      name="taskAssignments"
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      checked={notificationSettings.taskAssignments}
                      onChange={handleNotificationChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="taskAssignments" className="font-medium text-gray-700">Task Assignments</label>
                    <p className="text-gray-500">Be notified when you are assigned to a task</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="taskUpdates"
                      name="taskUpdates"
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      checked={notificationSettings.taskUpdates}
                      onChange={handleNotificationChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="taskUpdates" className="font-medium text-gray-700">Task Updates</label>
                    <p className="text-gray-500">Be notified when your tasks are updated</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="projectUpdates"
                      name="projectUpdates"
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      checked={notificationSettings.projectUpdates}
                      onChange={handleNotificationChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="projectUpdates" className="font-medium text-gray-700">Project Updates</label>
                    <p className="text-gray-500">Be notified about changes in projects you're part of</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="mentions"
                      name="mentions"
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      checked={notificationSettings.mentions}
                      onChange={handleNotificationChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="mentions" className="font-medium text-gray-700">Mentions</label>
                    <p className="text-gray-500">Be notified when someone mentions you in comments</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="reminders"
                      name="reminders"
                      type="checkbox"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      checked={notificationSettings.reminders}
                      onChange={handleNotificationChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="reminders" className="font-medium text-gray-700">Reminders</label>
                    <p className="text-gray-500">Receive reminders about upcoming and overdue tasks</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Save Notification Settings'
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Application Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Application Settings</h2>
            
            <form onSubmit={saveAppSettings}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <select
                    id="theme"
                    name="theme"
                    className="form-input w-full"
                    value={appSettings.theme}
                    onChange={handleAppSettingChange}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    className="form-input w-full"
                    value={appSettings.language}
                    onChange={handleAppSettingChange}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    className="form-input w-full"
                    value={appSettings.timezone}
                    onChange={handleAppSettingChange}
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="CST">CST (Central Standard Time)</option>
                    <option value="MST">MST (Mountain Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <select
                    id="dateFormat"
                    name="dateFormat"
                    className="form-input w-full"
                    value={appSettings.dateFormat}
                    onChange={handleAppSettingChange}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Save Application Settings'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Admin Settings */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-700">Data Export</h3>
                <p className="text-sm text-gray-500 mt-1">Download a copy of all your data</p>
                <button className="btn-secondary mt-2">Export Data</button>
              </div>
              
              {hasRole(['admin']) && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-700">Admin Panel</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage users and system settings</p>
                  <button className="btn-secondary mt-2">Open Admin Panel</button>
                </div>
              )}
              
              <div className="p-4 bg-red-50 rounded-md">
                <h3 className="font-medium text-red-700">Danger Zone</h3>
                <p className="text-sm text-red-500 mt-1">Delete your account permanently</p>
                <button className="mt-2 px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">About</h2>
            
            <div className="space-y-2">
              <div>
                <h3 className="font-medium text-gray-700">TaskNest</h3>
                <p className="text-sm text-gray-500">v1.0.0</p>
              </div>
              
              <div className="pt-2">
                <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">
                  Terms of Service
                </a>
              </div>
              
              <div>
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 text-sm">
                  Privacy Policy
                </Link>
              </div>
              
              <div>
                <a href="#" className="text-primary-600 hover:text-primary-700 text-sm">
                  Help Center
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
