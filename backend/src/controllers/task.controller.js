const Task = require('../models/task.model');
const Project = require('../models/project.model');
const { notifyTaskAssignees, notifyProjectMembers } = require('./notification.controller');

/**
 * Helper function to check user's role in a project
 * @param {Object} project - Project document
 * @param {String} userId - User ID to check
 * @returns {Object|null} - Member object if found, null otherwise
 */
const getUserProjectRole = (project, userId) => {
  return project.members.find(member => member.user.toString() === userId.toString());
};

/**
 * @desc    Get all tasks for a project
 * @route   GET /api/v1/projects/:projectId/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user is a member of the project
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }
    
    // Get tasks with populated fields
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo.user', 'name email department jobTitle')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/v1/projects/:projectId/tasks/:id
 * @access  Private
 */
exports.getTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    
    const task = await Task.findOne({ _id: id, project: projectId })
      .populate('assignedTo.user', 'name email department jobTitle')
      .populate('createdBy', 'name email')
      .populate('comments.author', 'name email');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to the project
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create task
 * @route   POST /api/v1/projects/:projectId/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { assignedTo, assignees } = req.body;
    
    // Handle both assignees and assignedTo for compatibility
    const usersToAssign = assignees || assignedTo;
    
    // Check if project exists
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user has access to create tasks
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }
    
    // Supervisors and team-leads can create tasks, team-members need canAssignTasks permission
    const canCreateTasks = userMember.role === 'supervisor' || 
                          userMember.role === 'team-lead' || 
                          userMember.permissions.canAssignTasks;
    
    if (!canCreateTasks) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to create tasks.'
      });
    }
    
    // Validate assigned users are project members if provided
    if (usersToAssign && usersToAssign.length > 0) {
      const projectMemberIds = project.members.map(member => member.user.toString());
      const invalidUsers = usersToAssign.filter(userId => !projectMemberIds.includes(userId));
      
      if (invalidUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Some assigned users are not members of this project'
        });
      }
    }
    
    // Add project and user to request body
    req.body.project = projectId;
    req.body.createdBy = req.user.id;
    
    // Format assignedTo if provided
    if (usersToAssign && usersToAssign.length > 0) {
      req.body.assignedTo = usersToAssign.map(userId => ({
        user: userId,
        assignedAt: new Date(),
        assignedBy: req.user.id
      }));
    }
    
    const task = await Task.create(req.body);
    await task.populate('assignedTo.user', 'name email department jobTitle');
    await task.populate('createdBy', 'name email');
    
    // Send notifications to assigned users
    if (task.assignedTo && task.assignedTo.length > 0) {
      const assigneeIds = task.assignedTo.map(assignment => assignment.user._id);
      
      try {
        await notifyTaskAssignees(assigneeIds, {
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${task.title}`,
          relatedTask: task._id,
          relatedProject: projectId
        }, [req.user.id]);
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notification fails
      }
    }
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/v1/projects/:projectId/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    
    let task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to update the task
    const project = await Project.findById(projectId);
    
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && 
        task.createdBy.toString() !== req.user.id && 
        !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this task'
      });
    }
    
    task = await Task.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/v1/projects/:projectId/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    
    const task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to delete the task
    const project = await Project.findById(projectId);
    
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && 
        task.createdBy.toString() !== req.user.id && 
        !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this task'
      });
    }
    
    await Task.deleteOne({ _id: id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload task attachment
 * @route   POST /api/v1/projects/:projectId/tasks/:id/upload
 * @access  Private
 */
exports.uploadTaskAttachment = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    
    const task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to the task
    const project = await Project.findById(projectId);
    
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload attachments to this task'
      });
    }
    
    // File upload handled by separate file controller and S3 service
    // This is just a placeholder route for API documentation
    
    res.status(200).json({
      success: true,
      data: {
        message: 'File upload processing handled by file controller'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/v1/projects/:projectId/tasks/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    const task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Add comment
    task.comments.push({
      content: content.trim(),
      author: req.user.id,
      createdAt: new Date()
    });

    await task.save();
    await task.populate('comments.author', 'name email');

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task progress
 * @route   PUT /api/v1/projects/:projectId/tasks/:id/progress
 * @access  Private
 */
exports.updateTaskProgress = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const { completionPercentage } = req.body;

    if (completionPercentage < 0 || completionPercentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Completion percentage must be between 0 and 100'
      });
    }

    const task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user is assigned to the task or has project access
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    const isAssigned = task.assignedTo.some(assignment => 
      assignment.user.toString() === req.user.id
    );

    const canUpdateTasks = userMember.role === 'supervisor' || 
                          userMember.role === 'team-lead' || 
                          userMember.permissions.canAssignTasks;

    if (!isAssigned && !canUpdateTasks) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not assigned to this task and do not have update permissions.'
      });
    }

    // Update progress
    task.completionPercentage = completionPercentage;

    // Auto-update status based on progress
    if (completionPercentage === 0) {
      task.status = 'pending';
    } else if (completionPercentage === 100) {
      task.status = 'completed';
    } else {
      task.status = 'in-progress';
    }

    await task.save();
    await task.populate('assignedTo.user', 'name email department jobTitle');

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign users to task
 * @route   PUT /api/v1/projects/:projectId/tasks/:id/assign
 * @access  Private
 */
exports.assignTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }

    const task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user has assignment permissions
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    const canAssignTasks = userMember.role === 'supervisor' || 
                          userMember.role === 'team-lead' || 
                          userMember.permissions.canAssignTasks;
    
    if (!canAssignTasks) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to assign tasks.'
      });
    }

    // Verify all users are project members
    const projectMemberIds = project.members.map(member => member.user.toString());
    const invalidUsers = userIds.filter(userId => !projectMemberIds.includes(userId));
    
    if (invalidUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some users are not members of this project'
      });
    }

    // Clear existing assignments and add new ones
    task.assignedTo = userIds.map(userId => ({
      user: userId,
      assignedAt: new Date(),
      assignedBy: req.user.id
    }));

    await task.save();
    await task.populate('assignedTo.user', 'name email department jobTitle');
    await task.populate('assignedTo.assignedBy', 'name email');

    // Send notifications to newly assigned users
    try {
      await notifyTaskAssignees(userIds, {
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `You have been assigned to task: ${task.title}`,
        relatedTask: task._id,
        relatedProject: projectId
      }, [req.user.id]);
    } catch (notificationError) {
      console.error('Failed to send notifications:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};
