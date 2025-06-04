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
 * @desc    Get project analytics and metrics for overview widget
 * @route   GET /api/v1/projects/:id/analytics
 * @access  Private
 */
exports.getProjectAnalytics = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is a member
    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this project'
      });
    }

    // Get tasks for calculations
    const Task = require('../models/task.model');
    const tasks = await Task.find({ project: project._id });

    // Calculate analytics
    const analytics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      notStartedTasks: tasks.filter(t => t.status === 'not-started').length,
      overdueTasks: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length,
      highPriorityTasks: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
      completionPercentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
      activeMembers: project.members.length,
      recentActivity: tasks.filter(t => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(t.updatedAt) > oneDayAgo;
      }).length,
      projectHealth: calculateProjectHealth(project, tasks),
      timeProgress: calculateTimeProgress(project),
      memberContributions: calculateMemberContributions(tasks, project.members)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project status and settings
 * @route   PUT /api/v1/projects/:id/status
 * @access  Private (Supervisor/Team Lead)
 */
exports.updateProjectStatus = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || !userMember.permissions.canEditProject) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update project status'
      });
    }

    const { status, priorityLevel, deadline, settings } = req.body;

    if (status) project.status = status;
    if (priorityLevel) project.priorityLevel = priorityLevel;
    if (deadline) project.deadline = deadline;
    if (settings) project.settings = { ...project.settings, ...settings };

    await project.save();
    await project.populate('members.user', 'name email');

    // Emit real-time update
    socketService.emitToProject(project._id, 'project:status_updated', {
      projectId: project._id,
      status: project.status,
      updatedBy: req.user.name,
      timestamp: new Date()
    });

    // Create notification for members
    await createNotification({
      type: 'project_updated',
      message: `Project "${project.title}" status updated to ${status}`,
      users: project.members.map(m => m.user._id || m.user),
      data: { projectId: project._id, status }
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invite member to project
 * @route   POST /api/v1/projects/:id/invite
 * @access  Private (Supervisor/Team Lead with permission)
 */
exports.inviteMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || !userMember.permissions.canManageMembers) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to invite members'
      });
    }

    const { email, role = 'teamMember' } = req.body;

    // Find user by email
    const User = require('../models/user.model');
    const userToInvite = await User.findOne({ email: email.toLowerCase() });

    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        error: 'User not found with this email'
      });
    }

    // Check if user is already a member
    const existingMember = project.members.find(m => 
      (m.user._id || m.user).toString() === userToInvite._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this project'
      });
    }

    // Add member with role-based permissions
    const newMember = {
      user: userToInvite._id,
      role: role,
      joinedAt: new Date()
    };

    project.members.push(newMember);
    await project.save();
    await project.populate('members.user', 'name email department jobTitle');

    // Emit real-time update
    socketService.emitToProject(project._id, 'project:member_added', {
      projectId: project._id,
      member: newMember,
      addedBy: req.user.name,
      timestamp: new Date()
    });

    // Create notification
    await createNotification({
      type: 'project_invitation',
      message: `You have been added to project "${project.title}"`,
      users: [userToInvite._id],
      data: { projectId: project._id, role }
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
 * @desc    Update member role
 * @route   PUT /api/v1/projects/:id/members/:memberId/role
 * @access  Private (Supervisor only)
 */
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { id: projectId, memberId } = req.params;
    const { role } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || userMember.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        error: 'Only supervisors can change member roles'
      });
    }

    const memberToUpdate = project.members.find(m => 
      (m.user._id || m.user).toString() === memberId
    );

    if (!memberToUpdate) {
      return res.status(404).json({
        success: false,
        error: 'Member not found in project'
      });
    }

    memberToUpdate.role = role;
    await project.save();
    await project.populate('members.user', 'name email department jobTitle');

    // Emit real-time update
    socketService.emitToProject(project._id, 'project:member_role_updated', {
      projectId: project._id,
      memberId: memberId,
      newRole: role,
      updatedBy: req.user.name,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project activity feed
 * @route   GET /api/v1/projects/:id/activity
 * @access  Private
 */
exports.getProjectActivity = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this project'
      });
    }

    const { limit = 20, page = 1 } = req.query;

    // Get activities from tasks, discussions, and notifications
    const Task = require('../models/task.model');
    const Discussion = require('../models/discussion.model');
    const Notification = require('../models/notification.model');

    const [tasks, discussions, notifications] = await Promise.all([
      Task.find({ project: project._id })
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
      Discussion.find({ project: project._id })
        .populate('author', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
      Notification.find({
        'data.projectId': project._id,
        users: req.user.id
      })
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Combine and format activities
    const activities = [
      ...tasks.map(task => ({
        type: 'task',
        id: task._id,
        title: task.title,
        action: 'updated',
        user: task.assignedTo || task.createdBy,
        timestamp: task.updatedAt,
        data: { status: task.status, priority: task.priority }
      })),
      ...discussions.map(discussion => ({
        type: 'discussion',
        id: discussion._id,
        title: discussion.title,
        action: 'posted',
        user: discussion.author,
        timestamp: discussion.updatedAt,
        data: { content: discussion.content.substring(0, 100) }
      })),
      ...notifications.map(notification => ({
        type: 'notification',
        id: notification._id,
        title: notification.message,
        action: 'created',
        user: notification.createdBy,
        timestamp: notification.createdAt,
        data: notification.data
      }))
    ];

    // Sort by timestamp and paginate
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const startIndex = (page - 1) * limit;
    const paginatedActivities = activities.slice(startIndex, startIndex + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length,
        pages: Math.ceil(activities.length / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function calculateProjectHealth(project, tasks) {
  let health = 100;
  
  // Reduce health for overdue tasks
  const overdueTasks = tasks.filter(t => 
    t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
  );
  health -= (overdueTasks.length / tasks.length) * 30;
  
  // Reduce health for project deadline
  const daysToDeadline = Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysToDeadline < 0) health -= 20;
  else if (daysToDeadline < 7) health -= 10;
  
  // Factor in completion rate
  const completionRate = tasks.length > 0 ? tasks.filter(t => t.status === 'completed').length / tasks.length : 1;
  if (completionRate < 0.5) health -= 15;
  
  return Math.max(0, Math.round(health));
}

function calculateTimeProgress(project) {
  const start = new Date(project.startDate);
  const end = new Date(project.deadline);
  const now = new Date();
  
  const totalTime = end - start;
  const elapsed = now - start;
  
  return Math.min(100, Math.max(0, Math.round((elapsed / totalTime) * 100)));
}

function calculateMemberContributions(tasks, members) {
  return members.map(member => {
    const memberTasks = tasks.filter(t => 
      (t.assignedTo && t.assignedTo.toString() === (member.user._id || member.user).toString())
    );
    const completedTasks = memberTasks.filter(t => t.status === 'completed');
    
    return {
      memberId: member.user._id || member.user,
      name: member.user.name,
      totalTasks: memberTasks.length,
      completedTasks: completedTasks.length,
      completionRate: memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0
    };
  });
}

/**
 * @desc    Remove member from project
 * @route   DELETE /api/v1/projects/:id/members/:memberId
 * @access  Private (Supervisor only)
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

    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || userMember.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        error: 'Only supervisors can remove members'
      });
    }

    const memberToRemove = project.members.find(m => 
      (m.user._id || m.user).toString() === memberId
    );

    if (!memberToRemove) {
      return res.status(404).json({
        success: false,
        error: 'Member not found in project'
      });
    }

    // Don't allow supervisor to remove themselves if they're the only supervisor
    const supervisors = project.members.filter(m => m.role === 'supervisor');
    if (memberToRemove.role === 'supervisor' && supervisors.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove the last supervisor from the project'
      });
    }

    // Remove member from project
    project.members = project.members.filter(m => 
      (m.user._id || m.user).toString() !== memberId
    );

    await project.save();
    await project.populate('members.user', 'name email department jobTitle');

    // Emit real-time update
    socketService.emitToProject(project._id, 'project:member_removed', {
      projectId: project._id,
      memberId: memberId,
      removedBy: req.user.name,
      timestamp: new Date()
    });

    // Create notification for removed member
    await createNotification({
      recipient: memberId,
      type: 'project_update',
      title: 'Removed from Project',
      message: `You have been removed from project "${project.name}"`,
      data: {
        projectId: project._id,
        projectName: project.name,
        action: 'member_removed'
      }
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};
