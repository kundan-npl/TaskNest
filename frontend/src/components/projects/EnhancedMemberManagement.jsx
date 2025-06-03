import React, { useState } from 'react';
import { 
  UsersIcon, 
  EnvelopeIcon, 
  PlusIcon, 
  XMarkIcon, 
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const EnhancedMemberManagement = ({ 
  formData, 
  availableUsers, 
  loadingUsers, 
  handleMemberToggle, 
  handleMemberRoleChange 
}) => {
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('team-member');
  const [inviteEmails, setInviteEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');

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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmailInvite = () => {
    const email = emailInput.trim().toLowerCase();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (inviteEmails.some(invite => invite.email === email)) {
      toast.error('This email is already in the invite list');
      return;
    }

    // Check if email already exists in available users
    if (availableUsers.some(user => user.email.toLowerCase() === email)) {
      toast.error('This user is already in the system. Please select them from the list below.');
      return;
    }

    const newInvite = {
      id: Date.now(),
      email,
      role: memberRole,
      status: 'pending'
    };

    setInviteEmails([...inviteEmails, newInvite]);
    setEmailInput('');
    toast.success('Email added to invite list');
  };

  const removeEmailInvite = (inviteId) => {
    setInviteEmails(inviteEmails.filter(invite => invite.id !== inviteId));
  };

  const updateInviteRole = (inviteId, newRole) => {
    setInviteEmails(inviteEmails.map(invite => 
      invite.id === inviteId ? { ...invite, role: newRole } : invite
    ));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmailInvite();
    }
  };

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

      {/* Email Invitation Section */}
      <div className="mb-8">
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Invite by Email</h3>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            Invite team members who aren't yet part of your organization
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter email address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="w-40">
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={addEmailInvite}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Pending Email Invites */}
            {inviteEmails.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Pending Invites ({inviteEmails.length}):</p>
                {inviteEmails.map((invite) => {
                  const roleInfo = getRoleInfo(invite.role);
                  return (
                    <div key={invite.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                          <p className="text-xs text-gray-500">Invitation pending</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <select
                          value={invite.role}
                          onChange={(e) => updateInviteRole(invite.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {roleOptions.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        
                        <button
                          type="button"
                          onClick={() => removeEmailInvite(invite.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Existing Users Selection */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <UserCircleIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Select from Organization</h3>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-4">
            You will automatically be added as the project supervisor. Select additional team members:
          </p>
          
          {loadingUsers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading team members...</p>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No other users available in your organization</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableUsers.map((user) => {
                const isSelected = formData.members.some(m => m.user === user._id);
                const memberData = formData.members.find(m => m.user === user._id);
                
                return (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMemberToggle(user._id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        {isSelected && (
                          <CheckCircleIcon className="absolute -top-1 -right-1 h-3 w-3 text-green-500" />
                        )}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.department && (
                          <p className="text-xs text-gray-400">{user.department}</p>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={memberData?.role || 'team-member'}
                          onChange={(e) => handleMemberRoleChange(user._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {roleOptions.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
