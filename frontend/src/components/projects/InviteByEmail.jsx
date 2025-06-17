import React, { useState } from 'react';
import { EnvelopeIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const roleOptions = [
  { value: 'team-member', label: 'Team Member' },
  { value: 'team-lead', label: 'Team Lead' },
  { value: 'supervisor', label: 'Supervisor' }
];

const InviteByEmail = ({ inviteEmails, setInviteEmails, availableUsers = [] }) => {
  const [emailInput, setEmailInput] = useState('');
  const [memberRole, setMemberRole] = useState('team-member');

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

  return (
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
                <option key={role.value} value={role.value}>{role.label}</option>
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
            {inviteEmails.map((invite) => (
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
                      <option key={role.value} value={role.value}>{role.label}</option>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteByEmail;
