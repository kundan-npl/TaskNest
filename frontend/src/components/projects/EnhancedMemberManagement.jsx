import React, { useState } from 'react';
import { 
  UsersIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import InviteByEmail from './InviteByEmail';

const EnhancedMemberManagement = ({ 
  formData, 
  availableUsers, 
  loadingUsers, 
  handleMemberToggle, 
  handleMemberRoleChange,
  inviteEmails,
  setInviteEmails
}) => {
  const [memberRole, setMemberRole] = useState('team-member');

  const roleOptions = [
    { 
      value: 'team-member', 
      label: 'Team Member', 
      description: 'Can work on assigned tasks and collaborate',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    { 
      value: 'team-lead', 
      label: 'Team Lead', 
      description: 'Can manage tasks and coordinate team activities',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    { 
      value: 'supervisor', 
      label: 'Supervisor', 
      description: 'Full project control and member management',
      color: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ];

  const getRoleInfo = (roleValue) => {
    return roleOptions.find(role => role.value === roleValue) || roleOptions[0];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <UsersIcon className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-600">Invite team members and assign their roles</p>
        </div>
      </div>

      {/* Email Invitation Section (refactored) */}
      <InviteByEmail inviteEmails={inviteEmails} setInviteEmails={setInviteEmails} availableUsers={availableUsers} />

      {/* Role Information */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Role Descriptions</h4>
        <div className="space-y-2">
          {roleOptions.map(role => (
            <div key={role.value} className="flex items-start space-x-3">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                {role.label}
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {(formData.members.length > 0 || inviteEmails.length > 0) && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <h4 className="text-sm font-medium text-green-800">Team Summary</h4>
          </div>
          <p className="text-sm text-green-700">
            {formData.members.length + inviteEmails.length + 1} total members will be added 
            (including yourself as supervisor)
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedMemberManagement;
