import { api } from './authService';

// Base invitation service class
class InvitationService {
  /**
   * Send invitation to join project
   * @param {Object} invitationData - { projectId, email, role }
   * @returns {Promise<Object>} Response data
   */
  async sendInvitation(invitationData) {
    try {
      const response = await api.post('/invite/send', invitationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to send invitation');
    }
  }

  /**
   * Validate invitation token and get user status
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Invitation data and user status
   */
  async validateInvitation(token) {
    try {
      const response = await api.get(`/invite/validate/${token}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to validate invitation');
    }
  }

  /**
   * Accept or decline invitation
   * @param {string} token - Invitation token
   * @param {string} action - 'accept' or 'decline'
   * @returns {Promise<Object>} Response data
   */
  async respondToInvitation(token, action) {
    try {
      const response = await api.post('/invite/respond', {
        token,
        action
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to respond to invitation');
    }
  }

  /**
   * Cancel invitation
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Response data
   */
  async cancelInvitation(token) {
    try {
      const response = await api.delete(`/invite/cancel/${token}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to cancel invitation');
    }
  }

  /**
   * Get all invitations for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project invitations
   */
  async getProjectInvitations(projectId) {
    try {
      const response = await api.get(`/invite/project/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project invitations');
    }
  }

  /**
   * Helper method to create invitation link
   * @param {string} token - Invitation token
   * @returns {string} Full invitation link
   */
  createInvitationLink(token) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite?token=${token}`;
  }

  /**
   * Helper method to extract token from invitation URL
   * @param {string} url - Invitation URL
   * @returns {string|null} Token or null if not found
   */
  extractTokenFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('token');
    } catch {
      return null;
    }
  }

  /**
   * Helper method to validate email format
   * @param {string} email - Email address
   * @returns {boolean} True if valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Helper method to get role display name
   * @param {string} role - Role code
   * @returns {string} Display name
   */
  getRoleDisplayName(role) {
    const roleMap = {
      'supervisor': 'Supervisor',
      'team-lead': 'Team Lead',
      'team-member': 'Team Member'
    };
    return roleMap[role] || role;
  }

  /**
   * Helper method to get role options for dropdowns
   * @returns {Array} Array of role options
   */
  getRoleOptions() {
    return [
      { value: 'team-member', label: 'Team Member', description: 'Can view and complete tasks' },
      { value: 'team-lead', label: 'Team Lead', description: 'Can manage team members and assign tasks' },
      { value: 'supervisor', label: 'Supervisor', description: 'Full project management access' }
    ];
  }

  /**
   * Helper method to get invitation status display
   * @param {string} status - Status code
   * @returns {Object} Status display info
   */
  getStatusDisplay(status) {
    const statusMap = {
      'pending': { 
        label: 'Pending', 
        color: 'yellow',
        description: 'Invitation sent, awaiting response'
      },
      'accepted': { 
        label: 'Accepted', 
        color: 'green',
        description: 'User has joined the project'
      },
      'declined': { 
        label: 'Declined', 
        color: 'red',
        description: 'User declined the invitation'
      },
      'expired': { 
        label: 'Expired', 
        color: 'gray',
        description: 'Invitation has expired'
      }
    };
    return statusMap[status] || { label: status, color: 'gray', description: '' };
  }

  /**
   * Helper method to check if invitation is still valid
   * @param {Object} invitation - Invitation object
   * @returns {boolean} True if valid
   */
  isInvitationValid(invitation) {
    if (invitation.status !== 'pending') return false;
    if (!invitation.expiresAt) return true;
    return new Date(invitation.expiresAt) > new Date();
  }

  /**
   * Helper method to get time until expiry
   * @param {string} expiresAt - Expiry date string
   * @returns {string} Human readable time
   */
  getTimeUntilExpiry(expiresAt) {
    if (!expiresAt) return 'Never expires';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Expires soon';
  }
}

// Create and export singleton instance
const invitationService = new InvitationService();
export default invitationService;
