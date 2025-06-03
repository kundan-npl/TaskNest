import React from 'react';
import { 
  CogIcon, 
  EyeIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';

const ProjectSettings = ({ formData, handleChange }) => {
  const visibilityOptions = [
    {
      value: 'private',
      label: 'Private',
      description: 'Only project members can see this project',
      icon: ShieldCheckIcon,
      color: 'text-red-600 bg-red-100'
    },
    {
      value: 'team',
      label: 'Team',
      description: 'Your department/team can see this project',
      icon: UsersIcon,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      value: 'organization',
      label: 'Organization',
      description: 'Everyone in your organization can see this project',
      icon: EyeIcon,
      color: 'text-green-600 bg-green-100'
    }
  ];

  const getCurrentVisibilityOption = () => {
    return visibilityOptions.find(option => option.value === formData.settings.visibilityLevel) || visibilityOptions[1];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gray-100 rounded-lg">
          <CogIcon className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Project Settings</h2>
          <p className="text-sm text-gray-600">Configure project permissions and preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Visibility Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Project Visibility
          </label>
          <div className="space-y-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.settings.visibilityLevel === option.value;
              
              return (
                <label
                  key={option.value}
                  className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="settings.visibilityLevel"
                    value={option.value}
                    checked={isSelected}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  
                  <div className={`flex-shrink-0 p-2 rounded-lg ${option.color} mr-3`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      {isSelected && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="h-2 w-2 bg-primary-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Project Permissions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Project Permissions</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  id="settings.allowMemberInvite"
                  name="settings.allowMemberInvite"
                  checked={formData.settings.allowMemberInvite}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="settings.allowMemberInvite" className="text-sm font-medium text-gray-900">
                  Allow team members to invite others
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Team members can invite new people to join this project
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  id="settings.requireApprovalForTasks"
                  name="settings.requireApprovalForTasks"
                  checked={formData.settings.requireApprovalForTasks}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="settings.requireApprovalForTasks" className="text-sm font-medium text-gray-900">
                  Require approval for task completion
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Tasks must be approved by supervisors or team leads before marking as complete
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  id="settings.enableNotifications"
                  name="settings.enableNotifications"
                  checked={formData.settings.enableNotifications}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="settings.enableNotifications" className="text-sm font-medium text-gray-900">
                  Enable project notifications
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Send notifications for project updates, new tasks, and important events
                </p>
              </div>
            </div>
          </div>

          {formData.settings.enableNotifications && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <BellIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Notification Types</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Task assignments and updates</p>
                <p>• Project milestone achievements</p>
                <p>• New team member additions</p>
                <p>• Deadline reminders</p>
              </div>
            </div>
          )}
        </div>

        {/* Settings Summary */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Settings Summary</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• Visibility: <span className="font-medium">{getCurrentVisibilityOption().label}</span></p>
            <p>• Member invites: <span className="font-medium">{formData.settings.allowMemberInvite ? 'Allowed' : 'Restricted'}</span></p>
            <p>• Task approval: <span className="font-medium">{formData.settings.requireApprovalForTasks ? 'Required' : 'Not required'}</span></p>
            <p>• Notifications: <span className="font-medium">{formData.settings.enableNotifications ? 'Enabled' : 'Disabled'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;
