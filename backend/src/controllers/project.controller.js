const Project = require('../models/project.model');
const User = require('../models/user.model');
const { notifyProjectMembers, createNotification } = require('./notification.controller');
const socketService = require('../services/socketService');

/**
 * Helper function to check user's role in a project
 * @param {Object} project - Project document
 * @param {String} userId - User ID to check
 * @returns {Object|null} - Member object if found, null otherwise
 */
const getUserProjectRole = (project, userId) => {
  return project.members.find(member => {
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
};

/**
 * @desc    Get all projects for user
 * @route   GET /api/v1/projects
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
  try {
    // Get projects where user is a member
    const projects = await Project.find({
      'members.user': req.user.id
    })
    .populate('members.user', 'name email department jobTitle')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    // Add user's role information to each project
    const projectsWithRoles = projects.map(project => {
      const userMember = getUserProjectRole(project, req.user.id);
      return {
        ...project.toObject(),
        userRole: userMember?.role || null,
        userPermissions: userMember ? Object.keys(userMember.permissions).filter(key => userMember.permissions[key]) : []
      };
    });
    
    res.status(200).json({
      success: true,
      count: projectsWithRoles.length,
      data: projectsWithRoles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email department jobTitle')
      .populate('createdBy', 'name email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Debug logging
    console.log('Project ID:', req.params.id);
    console.log('User ID:', req.user.id);
    console.log('Project members:', project.members.map(m => ({ userId: m.user._id || m.user, role: m.role })));

    // Check if user is a member of the project
    const userMember = getUserProjectRole(project, req.user.id);
    
    console.log('User member found:', userMember);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Add user's role and permissions to response
    const projectData = {
      ...project.toObject(),
      userRole: userMember.role,
      userPermissions: Object.keys(userMember.permissions).filter(key => userMember.permissions[key])
    };

    res.status(200).json({
      success: true,
      data: projectData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/v1/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, priorityLevel, deadline } = req.body;

    // Create project with creator as supervisor
    const project = await Project.create({
      title,
      description,
      priorityLevel: priorityLevel || 'medium',
      deadline,
      createdBy: req.user.id,
      members: [{
        user: req.user.id,
        role: 'supervisor',
        joinedAt: new Date(),
        permissions: {
          canAssignTasks: true,
          canEditProject: true,
          canManageMembers: true,
          canDeleteProject: true,
          canViewReports: true
        }
      }]
    });

    await project.populate('members.user', 'name email department jobTitle');
    await project.populate('createdBy', 'name email');

    // Emit real-time update for project creation
    socketService.broadcastTaskUpdate(project._id, {
      type: 'project_created',
      project: project,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/v1/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has update permission
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember || !userMember.permissions.canEditProject) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to update this project.'
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('members.user', 'name email department jobTitle')
    .populate('createdBy', 'name email');

    // Emit real-time update for project update
    socketService.broadcastTaskUpdate(updatedProject._id, {
      type: 'project_updated',
      project: updatedProject,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has delete permission
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember || !userMember.permissions.canDeleteProject) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to delete this project.'
      });
    }

    await project.deleteOne();

    // Emit real-time update for project deletion
    socketService.broadcastTaskUpdate(req.params.id, {
      type: 'project_deleted',
      projectId: req.params.id,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add member to project
 * @route   POST /api/v1/projects/:id/members
 * @access  Private
 */
exports.addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has canManageMembers permission
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember || !userMember.permissions.canManageMembers) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to manage members.'
      });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is already a member
    const existingMember = getUserProjectRole(project, userId);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this project'
      });
    }

    // Validate role
    const validRoles = ['supervisor', 'team-lead', 'team-member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be supervisor, team-lead, or team-member'
      });
    }

    // Set permissions based on role
    const rolePermissions = {
      'supervisor': { 
        canAssignTasks: true,
        canEditProject: true, 
        canManageMembers: true, 
        canDeleteProject: true, 
        canViewReports: true 
      },
      'team-lead': { 
        canAssignTasks: true,
        canEditProject: false, 
        canManageMembers: false, 
        canDeleteProject: false, 
        canViewReports: true 
      },
      'team-member': { 
        canAssignTasks: false,
        canEditProject: false, 
        canManageMembers: false, 
        canDeleteProject: false, 
        canViewReports: true 
      }
    };

    // Add member to project
    project.members.push({
      user: userId,
      role,
      joinedAt: new Date(),
      permissions: rolePermissions[role]
    });

    await project.save();
    await project.populate('members.user', 'name email department jobTitle');

    // Send notification to the new member
    try {
      await createNotification({
        user: userId,
        type: 'project_invitation',
        title: 'Added to Project',
        message: `You have been added to project: ${project.name} with role ${role}`,
        relatedProject: project._id
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update member role
 * @route   PUT /api/v1/projects/:id/members/:memberId
 * @access  Private
 */
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const { id: projectId, memberId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has canManageMembers permission
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember || !userMember.permissions.canManageMembers) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to manage members.'
      });
    }

    // Find the member to update
    const memberIndex = project.members.findIndex(member => member.user.toString() === memberId);
    
    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Member not found in this project'
      });
    }

    // Validate role
    const validRoles = ['supervisor', 'team-lead', 'team-member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be supervisor, team-lead, or team-member'
      });
    }

    // Prevent self-demotion from supervisor if only supervisor
    const supervisors = project.members.filter(member => member.role === 'supervisor');
    if (req.user.id === memberId && userMember.role === 'supervisor' && role !== 'supervisor' && supervisors.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot demote yourself as the only supervisor'
      });
    }

    // Set permissions based on role
    const rolePermissions = {
      'supervisor': { 
        canAssignTasks: true,
        canEditProject: true, 
        canManageMembers: true, 
        canDeleteProject: true, 
        canViewReports: true 
      },
      'team-lead': { 
        canAssignTasks: true,
        canEditProject: false, 
        canManageMembers: false, 
        canDeleteProject: false, 
        canViewReports: true 
      },
      'team-member': { 
        canAssignTasks: false,
        canEditProject: false, 
        canManageMembers: false, 
        canDeleteProject: false, 
        canViewReports: true 
      }
    };

    // Update member role and permissions
    project.members[memberIndex].role = role;
    project.members[memberIndex].permissions = rolePermissions[role];

    await project.save();
    await project.populate('members.user', 'name email department jobTitle');

    // Send notification about role change
    try {
      await createNotification({
        user: memberId,
        type: 'role_updated',
        title: 'Role Updated',
        message: `Your role in project "${project.name}" has been updated to ${role}`,
        relatedProject: projectId
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/v1/projects/:id/members/:memberId
 * @access  Private
 */
exports.removeMember = async (req, res, next) => {
  try {
    const { id: projectId, memberId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has canManageMembers permission
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember || !userMember.permissions.canManageMembers) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to manage members.'
      });
    }

    // Prevent removing self if only supervisor
    const supervisors = project.members.filter(member => member.role === 'supervisor');
    if (req.user.id === memberId && supervisors.length === 1 && supervisors[0].user.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove yourself as the only supervisor. Assign another supervisor first.'
      });
    }

    // Remove member
    project.members = project.members.filter(member => member.user.toString() !== memberId);

    await project.save();
    await project.populate('members.user', 'name email department jobTitle');

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};
