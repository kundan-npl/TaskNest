import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import invitationService from '../../services/invitationService.js';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  TrashIcon,
  PaperAirplaneIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const InvitationManagerWidget = ({ projectId, permissions }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationService.getProjectInvitations(projectId);
      
      if (response.success) {
        setInvitations(response.data.invitations || []);
      } else {
        throw new Error(response.error || 'Failed to load invitations');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (token) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [token]: true }));
    
    try {
      const response = await invitationService.cancelInvitation(token);
      
      if (response.success) {
        toast.success('Invitation cancelled successfully');
        await loadInvitations(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to cancel invitation');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [token]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading invitations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadInvitations}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const allInvitations = invitations;

  return (
    <div className="bg-white rounded-lg shadow">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Project Invitations</h3>
          </div>
          {pendingInvitations.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {pendingInvitations.length} Pending
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        
        {/* Summary Stats */}
        {allInvitations.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {invitations.filter(inv => inv.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {invitations.filter(inv => inv.status === 'accepted').length}
              </div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {invitations.filter(inv => inv.status === 'declined').length}
              </div>
              <div className="text-sm text-gray-600">Declined</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {invitations.filter(inv => inv.status === 'expired').length}
              </div>
              <div className="text-sm text-gray-600">Expired</div>
            </div>
          </div>
        )}

        {/* Invitations List */}
        {allInvitations.length === 0 ? (
          <div className="text-center py-12">
            <PaperAirplaneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations sent</h3>
            <p className="text-gray-600 mb-4">
              Start collaborating by inviting team members to this project.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allInvitations.map((invitation) => (
              <div
                key={invitation.token}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  
                  {/* Invitation Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {invitation.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {invitation.email}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invitation.status)}`}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">
                              {invitationService.getStatusDisplay(invitation.status).label}
                            </span>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">
                            Role: <span className="font-medium">
                              {invitationService.getRoleDisplayName(invitation.role)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Sent: {formatDate(invitation.invitedAt)}
                          </p>
                          {invitation.expiresAt && invitation.status === 'pending' && (
                            <p className="text-xs text-gray-500">
                              {invitationService.getTimeUntilExpiry(invitation.expiresAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {permissions?.canManageMembers && invitation.status === 'pending' && (
                    <div className="flex-shrink-0 ml-4">
                      <button
                        onClick={() => handleCancelInvitation(invitation.token)}
                        disabled={actionLoading[invitation.token]}
                        className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Cancel invitation"
                      >
                        {actionLoading[invitation.token] ? (
                          <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-red-600 rounded-full"></div>
                        ) : (
                          <>
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Cancel
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Info for Accepted/Declined */}
                {(invitation.acceptedAt || invitation.respondedAt) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {invitation.status === 'accepted' ? 'Accepted' : 'Responded'} on{' '}
                      {formatDate(invitation.acceptedAt || invitation.respondedAt)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationManagerWidget;
