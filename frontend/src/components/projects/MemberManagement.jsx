import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const MemberManagement = ({ project, userRole, onMemberUpdate }) => {
  const { currentUser } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('team-member');
  const [loading, setLoading] = useState(false);

  // Project role definitions with descriptions
  const projectRoles = [
    {
      value: 'supervisor',
      label: 'Supervisor',
      description: 'Full project control, can manage all aspects including members and settings',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      value: 'team-lead',
      label: 'Team Lead',
      description: 'Can manage tasks, assign work, and coordinate team activities',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      value: 'team-member',
      label: 'Team Member',
      description: 'Can work on assigned tasks and collaborate with team',
      color: 'bg-green-100 text-green-800'
    }
  ];

  const canManageMembers = userRole === 'supervisor';

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/projects/${project._id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add member');
      }

      const data = await response.json();
      toast.success('Member added successfully');
      setNewMemberEmail('');
      setNewMemberRole('team-member');
      setShowAddMember(false);
      onMemberUpdate();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    if (!canManageMembers) {
      toast.error('You do not have permission to update member roles');
      return;
    }

    try {
      const response = await fetch(`/api/v1/projects/${project._id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update member role');
      }

      toast.success('Member role updated successfully');
      onMemberUpdate();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!canManageMembers) {
      toast.error('You do not have permission to remove members');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this member from the project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/projects/${project._id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove member');
      }

      toast.success('Member removed successfully');
      onMemberUpdate();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getRoleInfo = (role) => {
    return projectRoles.find(r => r.value === role) || projectRoles[2]; // Default to team-member
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Project Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage team members and their roles in this project
          </p>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowAddMember(true)}
            className="btn-primary text-sm"
          >
            Add Member
          </button>
        )}
      </div>

      {/* Role Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Project Roles</h3>
        <div className="space-y-2">
          {projectRoles.map(role => (
            <div key={role.value} className="flex items-start">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.color} mr-3 mt-0.5`}>
                {role.label}
              </span>
              <span className="text-sm text-gray-600">{role.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {project.members?.map(member => {
          const roleInfo = getRoleInfo(member.role);
          const isCurrentUser = member.user._id === currentUser?.id;
          
          return (
            <div key={member._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-800 font-semibold mr-4">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900 mr-2">
                      {member.user.name}
                      {isCurrentUser && <span className="text-xs text-gray-500 ml-1">(You)</span>}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {canManageMembers && !isCurrentUser && (
                <div className="flex items-center space-x-2">
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateMemberRole(member._id, e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {projectRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowAddMember(false)}></div>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full z-10 mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Team Member</h3>
            
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="memberEmail"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter team member's email"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="memberRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Role
                </label>
                <select
                  id="memberRole"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  {projectRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getRoleInfo(newMemberRole).description}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
