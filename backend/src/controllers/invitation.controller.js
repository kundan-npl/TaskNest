const Project = require('../models/project.model');
const User = require('../models/user.model');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Helper function to get permissions based on role
 */
const getPermissionsForRole = (role) => {
  const normalizedRole = String(role).toLowerCase().replace(' ', '-');
  const permissions = {
    'supervisor': {
      canAssignTasks: true, canEditProject: true, canManageMembers: true,
      canDeleteProject: true, canViewReports: true, canCreateTasks: true,
      canEditTasks: true, canManageFiles: true, canInviteMembers: true,
      canModerateDiscussions: true
    },
    'team-lead': {
      canAssignTasks: true, canEditProject: false, canManageMembers: true,
      canDeleteProject: false, canViewReports: true, canCreateTasks: true,
      canEditTasks: true, canManageFiles: true, canInviteMembers: true,
      canModerateDiscussions: false
    },
    'team-member': {
      canAssignTasks: false, canEditProject: false, canManageMembers: false,
      canDeleteProject: false, canViewReports: true, canCreateTasks: true,
      canEditTasks: true, canManageFiles: false, canInviteMembers: false,
      canModerateDiscussions: false
    }
  };
  return permissions[normalizedRole] || permissions['team-member'];
};

/**
 * Helper function to check user's role in a project
 */
const getUserProjectRole = (project, userId) => {
  return project.members.find(member => {
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
};

/**
 * @desc    Send invitation to join project
 * @route   POST /api/v1/invite/send
 * @access  Private
 */
const sendInvitation = async (req, res, next) => {
  try {
    const { projectId, email, role = 'team-member' } = req.body;

    // Validate required fields
    if (!projectId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has permission to invite members
    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || !userMember.permissions.canManageMembers) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to invite members to this project'
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user is already a member
    const existingMember = project.members.find(member => {
      const memberEmail = member.user.email || '';
      return memberEmail.toLowerCase() === normalizedEmail;
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this project'
      });
    }

    // Remove any existing pending invitations for this email
    project.pendingInvitations = project.pendingInvitations.filter(
      inv => inv.email.toLowerCase() !== normalizedEmail
    );

    // Generate secure invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    // Create invitation payload for JWT (for additional security)
    const invitePayload = {
      email: normalizedEmail,
      projectId: project._id,
      role,
      invitedBy: req.user.id,
      timestamp: Date.now()
    };

    // Sign the payload (optional extra security layer)
    const secureToken = jwt.sign(invitePayload, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: '7d'
    });

    // Add invitation to project
    const invitation = {
      email: normalizedEmail,
      role,
      token: inviteToken,
      secureToken, // JWT token for additional validation
      invitedBy: req.user.id,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending'
    };

    project.pendingInvitations.push(invitation);
    await project.save();

    // Prepare invitation link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteLink = `${frontendUrl}/invite?token=${inviteToken}`;

    // Send email invitation
    const emailService = require('../services/email.service');
    let emailResult = { success: false, error: 'Email service not configured' };

    if (emailService.isAvailable()) {
      emailResult = await emailService.sendProjectInvitation({
        email: normalizedEmail,
        projectName: project.title,
        inviterName: req.user.name,
        inviteToken,
        projectId: project._id,
        role,
        inviteLink
      });
    }

    res.status(200).json({
      success: true,
      message: emailResult.success 
        ? 'Invitation sent successfully' 
        : 'Invitation created but email delivery failed',
      data: {
        email: normalizedEmail,
        role,
        projectName: project.title,
        inviteLink,
        emailSent: emailResult.success
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate invitation token and return user status
 * @route   GET /api/v1/invite/validate/:token
 * @access  Public
 */
const validateInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invitation token is required'
      });
    }

    // Find invitation across all projects
    const project = await Project.findOne({
      'pendingInvitations.token': token,
      'pendingInvitations.status': 'pending'
    }).populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    const invitation = project.pendingInvitations.find(
      inv => inv.token === token && inv.status === 'pending'
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    // Check if invitation has expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      // Mark as expired
      invitation.status = 'expired';
      await project.save();
      
      return res.status(400).json({
        success: false,
        error: 'Invitation has expired'
      });
    }

    // Additional JWT validation if secureToken exists
    if (invitation.secureToken) {
      try {
        const decoded = jwt.verify(invitation.secureToken, process.env.JWT_SECRET || 'fallback-secret');
        if (decoded.email !== invitation.email || decoded.projectId.toString() !== project._id.toString()) {
          return res.status(400).json({
            success: false,
            error: 'Invalid invitation token'
          });
        }
      } catch (jwtError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired invitation token'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: invitation.email });
    const isAuthenticated = req.user ? true : false;

    // Determine the appropriate action based on user status
    let userStatus = 'unknown';
    let requiresAuth = true;
    let authMode = 'register';

    if (existingUser) {
      userStatus = 'registered';
      authMode = 'login';
    } else {
      userStatus = 'unregistered';
      authMode = 'register';
    }

    // If user is authenticated, check if they can accept the invitation
    if (isAuthenticated) {
      if (req.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: `This invitation is for ${invitation.email}. Please log out and sign in with the correct account.`,
          data: {
            requiresAuth: true,
            authMode: 'login',
            wrongAccount: true,
            currentAccount: req.user.email,
            invitationEmail: invitation.email
          }
        });
      }
      requiresAuth = false;
    }

    res.status(200).json({
      success: true,
      data: {
        invitation: {
          email: invitation.email,
          role: invitation.role,
          projectName: project.title,
          projectId: project._id,
          invitedBy: {
            name: invitation.invitedBy.name || 'Unknown',
            email: invitation.invitedBy.email || ''
          },
          invitedAt: invitation.invitedAt
        },
        userStatus,
        requiresAuth,
        authMode,
        isAuthenticated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept invitation and join project
 * @route   POST /api/v1/invite/respond
 * @access  Private (user must be authenticated)
 */
const respondToInvitation = async (req, res, next) => {
  try {
    const { token, action } = req.body; // action: 'accept' or 'decline'

    if (!token || !action) {
      return res.status(400).json({
        success: false,
        error: 'Token and action are required'
      });
    }

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be either "accept" or "decline"'
      });
    }

    // Find the project with the invitation
    const project = await Project.findOne({
      'pendingInvitations.token': token,
      'pendingInvitations.status': 'pending'
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    const invitation = project.pendingInvitations.find(
      inv => inv.token === token && inv.status === 'pending'
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    // Check if invitation has expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      await project.save();
      
      return res.status(400).json({
        success: false,
        error: 'Invitation has expired'
      });
    }

    // Verify the invitation is for the authenticated user
    if (req.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'This invitation is not for your account'
      });
    }

    // Check if user is already a member
    const existingMember = getUserProjectRole(project, req.user.id);
    if (existingMember) {
      // Mark invitation as accepted anyway
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      invitation.acceptedBy = req.user.id;
      await project.save();

      return res.status(200).json({
        success: true,
        message: 'You are already a member of this project',
        data: {
          projectId: project._id,
          projectName: project.title,
          role: existingMember.role,
          alreadyMember: true
        }
      });
    }

    if (action === 'decline') {
      // Mark invitation as declined
      invitation.status = 'declined';
      invitation.respondedAt = new Date();
      invitation.respondedBy = req.user.id;
      await project.save();

      return res.status(200).json({
        success: true,
        message: 'Invitation declined successfully'
      });
    }

    // Accept invitation - add user to project
    const rolePermissions = getPermissionsForRole(invitation.role);

    project.members.push({
      user: req.user.id,
      role: invitation.role,
      joinedAt: new Date(),
      permissions: rolePermissions,
      invitedBy: invitation.invitedBy
    });

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = req.user.id;

    await project.save();

    // Create notification for project members
    try {
      const Notification = require('../models/notification.model');
      const memberIds = project.members
        .filter(m => (m.user._id || m.user).toString() !== req.user.id)
        .map(m => m.user._id || m.user);

      if (memberIds.length > 0) {
        const notifications = memberIds.map(memberId => ({
          recipient: memberId,
          sender: req.user.id,
          type: 'member_joined',
          title: 'New Team Member',
          message: `${req.user.name} has joined ${project.title}`,
          relatedProject: project._id,
          metadata: { 
            memberName: req.user.name,
            role: invitation.role 
          }
        }));

        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.status(200).json({
      success: true,
      message: `Successfully joined ${project.title} as ${invitation.role}`,
      data: {
        projectId: project._id,
        projectName: project.title,
        role: invitation.role,
        joinedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel/revoke invitation
 * @route   DELETE /api/v1/invite/cancel/:token
 * @access  Private
 */
const cancelInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Find the project with the invitation
    const project = await Project.findOne({
      'pendingInvitations.token': token
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    // Check if user has permission to cancel invitations
    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || !userMember.permissions.canManageMembers) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to cancel invitations'
      });
    }

    const invitationIndex = project.pendingInvitations.findIndex(
      inv => inv.token === token
    );

    if (invitationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    // Remove the invitation
    const cancelledInvitation = project.pendingInvitations[invitationIndex];
    project.pendingInvitations.splice(invitationIndex, 1);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully',
      data: {
        email: cancelledInvitation.email,
        projectName: project.title
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all invitations for a project
 * @route   GET /api/v1/invite/project/:projectId
 * @access  Private
 */
const getProjectInvitations = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('pendingInvitations.invitedBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has permission to view invitations
    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || !userMember.permissions.canManageMembers) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view invitations'
      });
    }

    // Filter and update expired invitations
    const now = new Date();
    let hasExpiredInvitations = false;

    project.pendingInvitations.forEach(invitation => {
      if (invitation.status === 'pending' && invitation.expiresAt && now > invitation.expiresAt) {
        invitation.status = 'expired';
        hasExpiredInvitations = true;
      }
    });

    if (hasExpiredInvitations) {
      await project.save();
    }

    // Return all invitations with their status
    const invitations = project.pendingInvitations.map(inv => ({
      token: inv.token,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      invitedAt: inv.invitedAt,
      expiresAt: inv.expiresAt,
      invitedBy: inv.invitedBy,
      acceptedAt: inv.acceptedAt,
      respondedAt: inv.respondedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.title,
        invitations,
        summary: {
          total: invitations.length,
          pending: invitations.filter(inv => inv.status === 'pending').length,
          accepted: invitations.filter(inv => inv.status === 'accepted').length,
          declined: invitations.filter(inv => inv.status === 'declined').length,
          expired: invitations.filter(inv => inv.status === 'expired').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendInvitation,
  validateInvitation,
  respondToInvitation,
  cancelInvitation,
  getProjectInvitations
};
