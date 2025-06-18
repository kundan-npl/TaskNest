import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import projectService from '../../../services/projectService';
import invitationService from '../../../services/invitationService';
import { useSocket } from '../../../context/SocketContext';
import SendInvitationModal from '../SendInvitationModal';
import InvitationManagerWidget from '../InvitationManagerWidget';

const TeamManagementWidget = ({ 
  members = [], 
  project, 
  currentUser, 
  userRole, 
  permissions,
  onMemberAdd,
  onMemberRemove,
  onRoleChange,
  className 
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRole, setSelectedRole] = useState('team-member');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [teamMembers, setTeamMembers] = useState(members);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const { socket, isConnected, onlineUsers } = useSocket();

  const roleLabels = {
    supervisor: 'Supervisor',
    'team-lead': 'Team Lead',
    'team-member': 'Team Member'
  };

  const roleColors = {
    supervisor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'team-lead': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'team-member': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  // Real-time team updates via Socket.IO
  useEffect(() => {
    const handleTeamUpdate = (event) => {
      const { member, action, projectId, roleData } = event.detail;
      
      // Only update if this is for the current project
      if (projectId !== (project?._id || project?.id)) return;

      switch (action) {
        case 'member_added':
          setTeamMembers(prev => [...prev, member]);
          if (onMemberAdd) onMemberAdd(member);
          toast.success(`${member.name} has joined the project`);
          break;
        case 'member_removed':
          setTeamMembers(prev => prev.filter(m => m._id !== member._id));
          if (onMemberRemove) onMemberRemove(member._id);
          toast.success(`${member.name} has been removed from the project`);
          break;
        case 'role_changed':
          setTeamMembers(prev => prev.map(m => 
            m._id === member._id ? { ...m, role: roleData.newRole } : m
          ));
          if (onRoleChange) onRoleChange(member._id, roleData.newRole);
          toast.success(`${member.name}'s role has been changed to ${roleData.newRole}`);
          break;
        case 'member_updated':
          setTeamMembers(prev => prev.map(m => 
            m._id === member._id ? { ...m, ...member } : m
          ));
          break;
        default:
          break;
      }
      
      // Reload team stats after any team change
      loadTeamStats();
    };

    // Listen for team updates via Socket.IO custom events
    window.addEventListener('teamUpdated', handleTeamUpdate);

    return () => {
      window.removeEventListener('teamUpdated', handleTeamUpdate);
    };
  }, [project?._id, project?.id, onMemberAdd, onMemberRemove, onRoleChange]);

  // Update local state when props change
  useEffect(() => {
    setTeamMembers(members);
  }, [members]);

  // Load team statistics
  useEffect(() => {
    loadTeamStats();
    loadPendingInvitations();
  }, [project?._id]);

  const loadPendingInvitations = async () => {
    if (!project?._id || !permissions?.canManageMembers) return;
    
    try {
      setLoadingInvitations(true);
      const response = await invitationService.getProjectInvitations(project._id);
      setPendingInvitations(response.data || []);
    } catch (error) {
      console.error('Failed to load pending invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const loadTeamStats = async () => {
    if (!project?._id) return;
    
    try {
      setLoadingStats(true);
      const stats = await projectService.getTeamStats(project._id);
      setTeamStats(stats);
    } catch (error) {
      console.error('Failed to load team stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChangeSubmit = async () => {
    if (!selectedMember || !project?._id) return;

    setLoading(true);
    try {
      const response = await projectService.updateMemberRole(
        project._id, 
        selectedMember._id, 
        selectedRole
      );

      if (response.success) {
        toast.success('Role updated successfully');
        onRoleChange?.(selectedMember._id, selectedRole);
        setShowRoleModal(false);
        setSelectedMember(null);
        loadTeamStats(); // Refresh stats
      } else {
        toast.error(response.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Failed to change role:', error);
      toast.error(error.response?.data?.message || 'Failed to change role');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!project?._id) return;
    
    if (window.confirm('Are you sure you want to remove this member from the project?')) {
      try {
        const response = await projectService.removeMember(project._id, memberId);
        
        if (response.success) {
          toast.success('Member removed successfully');
          onMemberRemove?.(memberId);
          loadTeamStats(); // Refresh stats
        } else {
          toast.error(response.message || 'Failed to remove member');
        }
      } catch (error) {
        console.error('Failed to remove member:', error);
        toast.error(error.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const handleBulkRoleChange = async (newRole) => {
    if (selectedMembers.size === 0) {
      toast.error('No members selected');
      return;
    }

    if (!project?._id) return;

    setLoading(true);
    try {
      const memberIds = Array.from(selectedMembers);
      const promises = memberIds.map(memberId =>
        projectService.updateMemberRole(project._id, memberId, newRole)
      );

      await Promise.all(promises);
      
      toast.success(`Updated roles for ${memberIds.length} member(s)`);
      memberIds.forEach(memberId => onRoleChange?.(memberId, newRole));
      setSelectedMembers(new Set());
      setBulkActionMode(false);
      loadTeamStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to update roles:', error);
      toast.error('Failed to update some member roles');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedMembers.size === 0) {
      toast.error('No members selected');
      return;
    }

    if (!project?._id) return;

    if (window.confirm(`Remove ${selectedMembers.size} member(s) from the project?`)) {
      setLoading(true);
      try {
        const memberIds = Array.from(selectedMembers);
        const promises = memberIds.map(memberId =>
          projectService.removeMember(project._id, memberId)
        );

        await Promise.all(promises);
        
        toast.success(`Removed ${memberIds.length} member(s)`);
        memberIds.forEach(memberId => onMemberRemove?.(memberId));
        setSelectedMembers(new Set());
        setBulkActionMode(false);
        loadTeamStats(); // Refresh stats
      } catch (error) {
        console.error('Failed to remove members:', error);
        toast.error('Failed to remove some members');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelInvitation = async (token) => {
    if (!project?._id) return;

    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        setLoadingInvitations(true);
        const response = await invitationService.cancelInvitation(token);
        
        if (response.success) {
          toast.success('Invitation cancelled successfully');
          loadPendingInvitations(); // Refresh pending invitations
        } else {
          toast.error(response.error || 'Failed to cancel invitation');
        }
      } catch (error) {
        console.error('Failed to cancel invitation:', error);
        toast.error(error.message || 'Failed to cancel invitation');
      } finally {
        setLoadingInvitations(false);
      }
    }
  };

  const toggleMemberSelection = (memberId) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAllMembers = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m._id)));
    }
  };

  const openRoleModal = (member) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setShowRoleModal(true);
  };

  const openMemberDetails = (member) => {
    setSelectedMemberDetails(member);
    setShowMemberDetails(true);
  };

  const handleInvitationSent = (invitation) => {
    // Refresh pending invitations and team stats when a new invitation is sent
    loadPendingInvitations();
    loadTeamStats();
    toast.success('Invitation sent successfully');
  };

  const getMemberContribution = (member) => {
    if (!teamStats?.memberContributions) return null;
    return teamStats.memberContributions.find(c => c.userId === member.user?._id);
  };

  const getRoleIcon = (role) => {
    // Handle both old camelCase and new kebab-case formats for backward compatibility
    switch (role) {
      case 'supervisor':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'team-lead':
      case 'teamLead': // Backward compatibility
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'team-member':
      case 'teamMember': // Backward compatibility
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };

  return (
    <div className={`widget-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {members.length} member{members.length !== 1 ? 's' : ''}
              {teamStats && !loadingStats && (
                <span className="ml-2">
                  • {teamStats.activeMembers || 0} active
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {bulkActionMode && selectedMembers.size > 0 && (
            <div className="flex items-center space-x-2 mr-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedMembers.size} selected
              </span>
              <div className="flex space-x-1">
                <select
                  onChange={(e) => e.target.value && handleBulkRoleChange(e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Change Role</option>
                  <option value="team-member">Team Member</option>
                  <option value="team-lead">Team Lead</option>
                  {permissions?.canManage && <option value="supervisor">Supervisor</option>}
                </select>
                <button
                  onClick={handleBulkRemove}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          
          {permissions?.canRemove && (
            <button
              onClick={() => setBulkActionMode(!bulkActionMode)}
              className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md transition-colors ${
                bulkActionMode
                  ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-600 dark:text-red-400 dark:bg-red-900 dark:hover:bg-red-800'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              {bulkActionMode ? 'Cancel' : 'Bulk Actions'}
            </button>
          )}
          
          {permissions?.canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite
            </button>
          )}
        </div>
      </div>



      {/* Search and Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {bulkActionMode && (
          <button
            onClick={selectAllMembers}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            {selectedMembers.size === filteredMembers.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Team Members List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No team members</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No members match your search.' : 'Get started by inviting team members.'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const contribution = getMemberContribution(member);
            return (
              <div 
                key={member._id} 
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  selectedMembers.has(member._id)
                    ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {bulkActionMode && (
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member._id)}
                      onChange={() => toggleMemberSelection(member._id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  )}
                  
                  <div 
                    className="flex items-center space-x-3 cursor-pointer"
                    onClick={() => openMemberDetails(member)}
                  >
                    <div className="relative">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={member.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user?.name}`}
                        alt={member.user?.name || 'User'}
                      />
                      {/* Online status indicator */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-700 rounded-full"></div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.user?.name || 'Unknown User'}
                        </span>
                        {currentUser?._id === member.user?._id && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{member.user?.email || 'No email'}</span>
                        {contribution && (
                          <span className="text-xs">
                            • {contribution.tasksCompleted || 0} tasks completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role] || roleColors['team-member']}`}>
                    <span className="mr-1">{getRoleIcon(member.role)}</span>
                    {roleLabels[member.role] || member.role}
                  </span>
                  
                  {!bulkActionMode && permissions?.canChangeRoles && currentUser?._id !== member.user?._id && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => openRoleModal(member)}
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Change role"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      {permissions?.canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Remove member"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pending Invitations Management */}
      {permissions?.canManageMembers && (
        <div className="mt-6">
          <InvitationManagerWidget
            projectId={project?._id}
            onInvitationUpdate={loadPendingInvitations}
          />
        </div>
      )}

      {/* Send Invitation Modal */}
      <SendInvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectId={project?._id}
        onInvitationSent={handleInvitationSent}
      />

      {/* Role Change Modal */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Role</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Change role for <strong>{selectedMember.user?.name}</strong>
                </p>
              </div>
              
              <div className="space-y-3">
                {Object.entries(roleLabels).map(([value, label]) => (
                  <label key={value} className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={selectedRole === value}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex items-center space-x-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[value]}`}>
                        {getRoleIcon(value)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChangeSubmit}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {showMemberDetails && selectedMemberDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Member Details</h3>
                <button
                  onClick={() => setShowMemberDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    className="h-16 w-16 rounded-full object-cover"
                    src={selectedMemberDetails.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMemberDetails.user?.name}`}
                    alt={selectedMemberDetails.user?.name || 'User'}
                  />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedMemberDetails.user?.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedMemberDetails.user?.email}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[selectedMemberDetails.role]}`}>
                      {getRoleIcon(selectedMemberDetails.role)}
                      <span className="ml-1">{roleLabels[selectedMemberDetails.role]}</span>
                    </span>
                  </div>
                </div>
                
                {getMemberContribution(selectedMemberDetails) && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Contribution Stats</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Tasks Completed</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getMemberContribution(selectedMemberDetails)?.tasksCompleted || 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Active Tasks</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getMemberContribution(selectedMemberDetails)?.activeTasks || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Joined: {new Date(selectedMemberDetails.joinedDate || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagementWidget;
