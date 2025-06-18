const Task = require('../models/task.model');
const Project = require('../models/project.model');
const { notifyTaskAssignees, notifyProjectMembers } = require('./notification.controller');
const socketService = require('../services/socketService');

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
    
    // Supervisors and team-leads can create tasks, team-members need canCreateTasks permission
    const canCreateTasks = userMember.role === 'supervisor' || 
                          userMember.role === 'team-lead' || 
                          userMember.permissions.canCreateTasks;
    
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
    
    // Emit real-time update for task creation
    socketService.broadcastTaskUpdate(projectId, {
      type: 'task_created',
      task: task,
      project: projectId,
      timestamp: new Date()
    });
    
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

    // FIX: Use project.members, not project.team
    const isTeamMember = project.members && Array.isArray(project.members)
      ? project.members.some(member => member.user.toString() === req.user.id)
      : false;

    if (project.createdBy.toString() !== req.user.id && 
        task.createdBy.toString() !== req.user.id && 
        !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this task'
      });
    }
    
    // Handle assignedTo field properly - preserve existing assignments if not provided
    const updateData = { ...req.body };
    
    console.log('[UpdateTask] Received req.body:', JSON.stringify(req.body, null, 2));
    console.log('[UpdateTask] Current task assignedTo:', JSON.stringify(task.assignedTo, null, 2));
    
    // If assignedTo is provided as an array of user IDs, convert to proper format
    if (updateData.assignedTo && Array.isArray(updateData.assignedTo)) {
      if (updateData.assignedTo.length > 0 && typeof updateData.assignedTo[0] === 'string') {
        // Convert array of user IDs to proper assignedTo format
        updateData.assignedTo = updateData.assignedTo.map(userId => ({
          user: userId,
          assignedAt: new Date(),
          assignedBy: req.user.id
        }));
        console.log('[UpdateTask] Converted assignedTo format:', JSON.stringify(updateData.assignedTo, null, 2));
      } else if (updateData.assignedTo.length === 0) {
        // If empty array is provided, clear assignments
        console.log('[UpdateTask] Empty assignedTo array provided, clearing assignments');
      }
      // If it's already in the correct format, leave it as is
    } else if (updateData.assignedTo === undefined) {
      // If assignedTo is not provided, don't update it (preserve existing assignments)
      delete updateData.assignedTo;
      console.log('[UpdateTask] assignedTo not provided, preserving existing assignments');
    }
    
    console.log('[UpdateTask] Final updateData:', JSON.stringify(updateData, null, 2));
    
    task = await Task.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    // Populate the updated task for the Socket.IO event
    await task.populate('assignedTo.user', 'name email department jobTitle');
    await task.populate('createdBy', 'name email');
    
    // Emit real-time update for task update
    socketService.broadcastTaskUpdate(projectId, {
      type: 'task_updated',
      task: task,
      project: projectId,
      timestamp: new Date()
    });
    
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
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const isTeamMember = project.members && project.members.some(member => 
      (member.user._id || member.user).toString() === req.user.id
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
    
    // Emit real-time update for task deletion
    socketService.broadcastTaskUpdate(projectId, {
      type: 'task_deleted',
      taskId: id,
      project: projectId,
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
    const { id } = req.params; // Only use id
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    const task = await Task.findById(id); // Find by id only
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Debug: log before and after
    console.log('Before push, comments.length:', task.comments.length);
    task.comments.push({
      content: content.trim(),
      author: req.user.id,
      createdAt: new Date()
    });
    console.log('After push, comments.length:', task.comments.length);

    try {
      await task.save();
      console.log('Task saved successfully, comments now:', task.comments.length);
    } catch (saveErr) {
      console.error('Error saving task with new comment:', saveErr);
      return res.status(500).json({ success: false, error: 'Failed to save comment' });
    }

    await task.populate('comments.author', 'name email');

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('addComment error:', error);
    next(error);
  }
};

/**
 * @desc    Get comments for a task
 * @route   GET /api/v1/tasks/:id/comments
 * @access  Private
 */
exports.getTaskComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('comments.author', 'name email profileImage');
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.status(200).json({
      success: true,
      data: (task.comments || []).map(comment => ({
        _id: comment._id,
        content: comment.content,
        author: comment.author ? {
          _id: comment.author._id,
          name: comment.author.name,
          avatar: comment.author.profileImage || '',
          email: comment.author.email
        } : null,
        createdAt: comment.createdAt
      }))
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
                          userMember.permissions.canEditTasks;

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

/**
 * @desc    Bulk update tasks
 * @route   PUT /api/v1/tasks/bulk-update
 * @access  Private
 */
exports.bulkUpdateTasks = async (req, res, next) => {
  try {
    const { taskIds, updates } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Task IDs array is required'
      });
    }

    // Find all tasks and verify permissions
    const tasks = await Task.find({ _id: { $in: taskIds } }).populate('project');
    
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No tasks found'
      });
    }

    // Check permissions for each task's project
    for (const task of tasks) {
      const userMember = getUserProjectRole(task.project, req.user.id);
      if (!userMember || !['supervisor', 'teamLead'].includes(userMember.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
      }
    }

    // Perform bulk update
    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: updates },
      { new: true }
    );

    // Get updated tasks
    const updatedTasks = await Task.find({ _id: { $in: taskIds } })
      .populate('assignedTo.user', 'name email')
      .populate('project', 'title');

    // Emit real-time updates
    updatedTasks.forEach(task => {
      socketService.emitToProject(task.project._id.toString(), 'task:bulk_updated', {
        task: task,
        updatedBy: req.user.id
      });
    });

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        tasks: updatedTasks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk delete tasks
 * @route   DELETE /api/v1/tasks/bulk-delete
 * @access  Private
 */
exports.bulkDeleteTasks = async (req, res, next) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Task IDs array is required'
      });
    }

    // Find all tasks and verify permissions
    const tasks = await Task.find({ _id: { $in: taskIds } }).populate('project');
    
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No tasks found'
      });
    }

    // Check permissions for each task's project
    for (const task of tasks) {
      const userMember = getUserProjectRole(task.project, req.user.id);
      if (!userMember || !['supervisor', 'teamLead'].includes(userMember.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
      }
    }

    // Delete tasks
    const result = await Task.deleteMany({ _id: { $in: taskIds } });

    // Emit real-time updates
    tasks.forEach(task => {
      socketService.emitToProject(task.project._id.toString(), 'task:deleted', {
        taskId: task._id,
        projectId: task.project._id,
        deletedBy: req.user.id
      });
    });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} tasks deleted successfully`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move tasks to different status
 * @route   PUT /api/v1/tasks/move-status
 * @access  Private
 */
exports.moveTasksToStatus = async (req, res, next) => {
  try {
    const { taskIds, status } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Task IDs array is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['todo', 'in_progress', 'in_review', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Find and update tasks
    const tasks = await Task.find({ _id: { $in: taskIds } }).populate('project');
    
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No tasks found'
      });
    }

    // Check permissions
    for (const task of tasks) {
      const userMember = getUserProjectRole(task.project, req.user.id);
      if (!userMember) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You are not a member of this project.'
        });
      }
    }

    // Update status
    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    );

    // Get updated tasks
    const updatedTasks = await Task.find({ _id: { $in: taskIds } })
      .populate('assignedTo.user', 'name email')
      .populate('project', 'title');

    // Emit real-time updates
    updatedTasks.forEach(task => {
      socketService.emitToProject(task.project._id.toString(), 'task:status_changed', {
        task: task,
        previousStatus: task.status,
        newStatus: status,
        updatedBy: req.user.id
      });
    });

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        tasks: updatedTasks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk assign tasks to user
 * @route   PUT /api/v1/tasks/bulk-assign
 * @access  Private
 */
exports.bulkAssignTasks = async (req, res, next) => {
  try {
    const { taskIds, userId } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Task IDs array is required'
      });
    }

    // Find tasks and verify permissions
    const tasks = await Task.find({ _id: { $in: taskIds } }).populate('project');
    
    if (tasks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No tasks found'
      });
    }

    // Check permissions for each task's project
    for (const task of tasks) {
      const userMember = getUserProjectRole(task.project, req.user.id);
      if (!userMember || !['supervisor', 'teamLead'].includes(userMember.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
      }
    }

    // Update assignments
    const updateData = userId ? 
      { 'assignedTo.user': userId, 'assignedTo.assignedAt': new Date() } :
      { $unset: { assignedTo: "" } };

    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      updateData
    );

    // Get updated tasks
    const updatedTasks = await Task.find({ _id: { $in: taskIds } })
      .populate('assignedTo.user', 'name email')
      .populate('project', 'title');

    // Emit real-time updates
    updatedTasks.forEach(task => {
      socketService.emitToProject(task.project._id.toString(), 'task:assigned', {
        task: task,
        assignedBy: req.user.id
      });
    });

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        tasks: updatedTasks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task analytics for project
 * @route   GET /api/v1/projects/:projectId/tasks/analytics
 * @access  Private
 */
exports.getTaskAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check project access
    const project = await Project.findById(projectId);
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
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Get task analytics
    const analytics = await Task.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          todoTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'completed'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          highPriorityTasks: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          averageCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                {
                  $subtract: ['$updatedAt', '$createdAt']
                },
                null
              ]
            }
          }
        }
      }
    ]);

    const result = analytics[0] || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      todoTasks: 0,
      overdueTasks: 0,
      highPriorityTasks: 0,
      averageCompletionTime: 0
    };

    // Calculate completion percentage
    result.completionPercentage = result.totalTasks > 0 ? 
      Math.round((result.completedTasks / result.totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search tasks within project
 * @route   GET /api/v1/projects/:projectId/tasks/search
 * @access  Private
 */
exports.searchTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }

    // Check project access
    const project = await Project.findById(projectId);
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
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Search tasks
    const tasks = await Task.find({
      project: projectId,
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'tags': { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .populate('assignedTo.user', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// Get a single task by ID only (no projectId) for /api/v1/tasks/:id/simple
exports.getTaskByIdSimple = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Find the task and populate references
    const task = await Task.findById(id)
      .populate('assignedTo.user', 'name email profileImage')
      .populate('createdBy', 'name email profileImage')
      .populate('project', 'title');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Keep all assigned users instead of flattening to first only
    const assignedToUsers = [];
    if (Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
      task.assignedTo.forEach(assignment => {
        if (assignment.user) {
          assignedToUsers.push({
            _id: assignment.user._id,
            name: assignment.user.name,
            avatar: assignment.user.profileImage || '',
          });
        }
      });
    }

    // Map status to frontend expected values - fix review mapping
    let status = task.status;
    if (status === 'todo') status = 'not-started';
    if (status === 'in-progress') status = 'in-progress';
    if (status === 'done') status = 'completed';
    if (status === 'review') status = 'review'; // Keep review as review, don't map to on-hold
    if (status === 'cancelled') status = 'on-hold';

    // Compose response
    res.status(200).json({
      success: true,
      data: {
        _id: task._id,
        title: task.title,
        description: task.description,
        status,
        priority: task.priority,
        assignedTo: assignedToUsers, // Return array of all assigned users
        createdBy: task.createdBy ? {
          _id: task.createdBy._id,
          name: task.createdBy.name,
          avatar: task.createdBy.profileImage || '',
        } : null,
        projectId: task.project?._id,
        projectName: task.project?.title,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        subtasks: task.subtasks || [],
        attachments: task.attachments || [],
        comments: (task.comments || []).map(comment => ({
          _id: comment._id,
          content: comment.content,
          author: comment.author ? {
            _id: comment.author._id,
            name: comment.author.name,
            avatar: comment.author.profileImage || '',
            email: comment.author.email
          } : null,
          createdAt: comment.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
