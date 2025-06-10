const mongoose = require('mongoose');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const Milestone = require('../models/milestone.model');
const socketService = require('../services/socketService');
const Notification = require('../models/notification.model');

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
 * @desc    Get all milestones for a project
 * @route   GET /api/v1/projects/:projectId/milestones
 * @access  Private
 */
exports.getProjectMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, sortBy = 'dueDate', order = 'asc' } = req.query;

    // Verify project access
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
        error: 'Not authorized to view this project'
      });
    }

    // Build query
    let query = { project: projectId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = order === 'desc' ? -1 : 1;

    const milestones = await Milestone.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('tasks', 'title status')
      .populate('dependencies.milestone', 'title status')
      .sort(sortObject);

    // Calculate progress for each milestone based on linked tasks
    const milestonesWithProgress = await Promise.all(
      milestones.map(async (milestone) => {
        if (milestone.tasks.length > 0) {
          const tasks = await Task.find({ _id: { $in: milestone.tasks } });
          const completedTasks = tasks.filter(task => task.status === 'completed');
          milestone.progress = Math.round((completedTasks.length / tasks.length) * 100);
        }
        return milestone;
      })
    );

    res.status(200).json({
      success: true,
      count: milestonesWithProgress.length,
      data: milestonesWithProgress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new milestone
 * @route   POST /api/v1/projects/:projectId/milestones
 * @access  Private (Team Lead/Supervisor)
 */
exports.createMilestone = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project access and permissions
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || (!userMember.permissions.canAssignTasks && userMember.role === 'teamMember')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create milestones'
      });
    }

    const milestoneData = {
      ...req.body,
      project: projectId,
      createdBy: req.user.id
    };

    const milestone = await Milestone.create(milestoneData);
    await milestone.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'tasks', select: 'title status' }
    ]);

    // Emit real-time update
    socketService.emitToProject(projectId, 'milestone:created', {
      milestone: milestone,
      createdBy: req.user.name,
      timestamp: new Date()
    });

    // Create notifications for assigned users
    if (milestone.assignedTo && milestone.assignedTo.length > 0) {
      const Notification = require('../models/notification.model');
      const notifications = [];
      
      for (const user of milestone.assignedTo) {
        notifications.push({
          title: 'Milestone Assigned',
          message: `You have been assigned to milestone "${milestone.title}"`,
          type: 'milestone_reached', // Using existing enum value
          recipient: user._id,
          sender: req.user.id,
          relatedProject: projectId,
          actionUrl: `/projects/${projectId}/milestones/${milestone._id}`,
          metadata: { 
            milestoneId: milestone._id,
            dueDate: milestone.dueDate 
          }
        });
      }
      
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a milestone
 * @route   PUT /api/v1/projects/:projectId/milestones/:id
 * @access  Private (Creator/Team Lead/Supervisor)
 */
exports.updateMilestone = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    // Verify project access
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
        error: 'Not authorized to access this project'
      });
    }

    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found'
      });
    }

    // Check permissions (creator, team lead, or supervisor can edit)
    const canEdit = milestone.createdBy.toString() === req.user.id ||
                   userMember.role === 'supervisor' ||
                   (userMember.role === 'teamLead' && userMember.permissions.canAssignTasks);

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this milestone'
      });
    }

    // Handle status change
    if (req.body.status && req.body.status === 'completed' && milestone.status !== 'completed') {
      req.body.completedAt = new Date();
      req.body.progress = 100;
    } else if (req.body.status && req.body.status !== 'completed') {
      req.body.completedAt = null;
    }

    const updatedMilestone = await Milestone.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'tasks', select: 'title status' }
    ]);

    // Emit real-time update
    socketService.emitToProject(projectId, 'milestone:updated', {
      milestone: updatedMilestone,
      updatedBy: req.user.name,
      timestamp: new Date()
    });

    // Create notification if status changed to completed
    if (req.body.status === 'completed' && milestone.status !== 'completed') {
      const Notification = require('../models/notification.model');
      const notifications = [];
      
      const memberIds = project.members.map(member => member.user._id || member.user);
      for (const memberId of memberIds) {
        notifications.push({
          title: 'Milestone Completed',
          message: `Milestone "${updatedMilestone.title}" has been completed`,
          type: 'milestone_reached',
          recipient: memberId,
          sender: req.user.id,
          relatedProject: projectId,
          actionUrl: `/projects/${projectId}/milestones/${updatedMilestone._id}`,
          metadata: { 
            milestoneId: updatedMilestone._id,
            completedBy: req.user.name
          }
        });
      }
      
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json({
      success: true,
      data: updatedMilestone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a milestone
 * @route   DELETE /api/v1/projects/:projectId/milestones/:id
 * @access  Private (Creator/Supervisor)
 */
exports.deleteMilestone = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    // Verify project access
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
        error: 'Not authorized to access this project'
      });
    }

    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found'
      });
    }

    // Check permissions (creator or supervisor can delete)
    const canDelete = milestone.createdBy.toString() === req.user.id ||
                     userMember.role === 'supervisor';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this milestone'
      });
    }

    await Milestone.findByIdAndDelete(id);

    // Emit real-time update
    socketService.emitToProject(projectId, 'milestone:deleted', {
      milestoneId: id,
      deletedBy: req.user.name,
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
 * @desc    Get milestone timeline view
 * @route   GET /api/v1/projects/:projectId/milestones/timeline
 * @access  Private
 */
exports.getMilestoneTimeline = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project access
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
        error: 'Not authorized to view this project'
      });
    }

    const milestones = await Milestone.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('tasks', 'title status')
      .sort({ dueDate: 1 });

    // Format for timeline view
    const timeline = milestones.map(milestone => ({
      id: milestone._id,
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate,
      status: milestone.status,
      priority: milestone.priority,
      progress: milestone.progress,
      assignedTo: milestone.assignedTo,
      tasksCount: milestone.tasks.length,
      completedTasks: milestone.tasks.filter(task => task.status === 'completed').length,
      isOverdue: milestone.dueDate < new Date() && milestone.status !== 'completed'
    }));

    res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Link tasks to milestone
 * @route   POST /api/v1/projects/:projectId/milestones/:id/tasks
 * @access  Private (Team Lead/Supervisor)
 */
exports.linkTasksToMilestone = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const { taskIds } = req.body;

    // Verify project access and permissions
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || (!userMember.permissions.canAssignTasks && userMember.role === 'teamMember')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to link tasks to milestones'
      });
    }

    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found'
      });
    }

    // Add tasks to milestone
    milestone.tasks = [...new Set([...milestone.tasks, ...taskIds])]; // Remove duplicates
    await milestone.save();

    // Update tasks to reference this milestone
    const Task = require('../models/task.model');
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { milestone: milestone._id }
    );

    const updatedMilestone = await Milestone.findById(id)
      .populate('tasks', 'title status')
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      data: updatedMilestone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get milestone analytics for a project
 * @route   GET /api/v1/projects/:projectId/milestones/analytics
 * @access  Private
 */
exports.getMilestoneAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project access
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
        error: 'Not authorized to view this project'
      });
    }

    const milestones = await Milestone.find({ project: projectId })
      .populate('tasks', 'status priority');

    const analytics = {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      inProgress: milestones.filter(m => m.status === 'in-progress').length,
      pending: milestones.filter(m => m.status === 'pending').length,
      overdue: milestones.filter(m => 
        m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed'
      ).length,
      averageProgress: milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length || 0,
      priorityDistribution: {
        high: milestones.filter(m => m.priority === 'high').length,
        medium: milestones.filter(m => m.priority === 'medium').length,
        low: milestones.filter(m => m.priority === 'low').length
      },
      taskDistribution: milestones.map(m => ({
        id: m._id,
        title: m.title,
        taskCount: m.tasks.length,
        completedTasks: m.tasks.filter(t => t.status === 'completed').length
      }))
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed milestone with progress and dependencies
 * @route   GET /api/v1/projects/:projectId/milestones/:id/details
 * @access  Private
 */
exports.getMilestoneDetails = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    // Verify project access
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
        error: 'Not authorized to view this project'
      });
    }

    const milestone = await Milestone.findById(id)
      .populate([
        { path: 'assignedTo', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email' },
        { path: 'tasks', populate: { path: 'assignedTo', select: 'name email' } },
        { path: 'dependencies', select: 'title status progress dueDate' }
      ]);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found'
      });
    }

    // Calculate detailed progress
    const taskProgress = milestone.tasks.reduce((acc, task) => {
      acc.total++;
      if (task.status === 'completed') acc.completed++;
      else if (task.status === 'in-progress') acc.inProgress++;
      else acc.pending++;
      return acc;
    }, { total: 0, completed: 0, inProgress: 0, pending: 0 });

    const detailedMilestone = {
      ...milestone.toObject(),
      taskProgress,
      isOverdue: milestone.dueDate && new Date(milestone.dueDate) < new Date() && milestone.status !== 'completed',
      daysRemaining: milestone.dueDate ? Math.ceil((new Date(milestone.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };

    res.json({
      success: true,
      data: detailedMilestone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update milestone progress
 * @route   PUT /api/v1/projects/:projectId/milestones/:id/progress
 * @access  Private
 */
exports.updateMilestoneProgress = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const { progress, notes } = req.body;

    // Verify project access and permissions
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
        error: 'Not authorized to access this project'
      });
    }

    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found'
      });
    }

    // Update progress
    milestone.progress = Math.max(0, Math.min(100, progress));
    
    // Auto-update status based on progress
    if (milestone.progress === 100 && milestone.status !== 'completed') {
      milestone.status = 'completed';
      milestone.completedAt = new Date();
    } else if (milestone.progress > 0 && milestone.status === 'pending') {
      milestone.status = 'in-progress';
    }

    // Add progress note if provided
    if (notes) {
      milestone.progressNotes = milestone.progressNotes || [];
      milestone.progressNotes.push({
        note: notes,
        progress: milestone.progress,
        updatedBy: req.user.id,
        updatedAt: new Date()
      });
    }

    await milestone.save();

    // Emit real-time update
    socketService.emitToProject(projectId, 'milestone:progress_updated', {
      milestoneId: id,
      progress: milestone.progress,
      status: milestone.status,
      updatedBy: req.user.name,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: milestone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk update milestones
 * @route   PUT /api/v1/projects/:projectId/milestones/bulk-update
 * @access  Private
 */
exports.bulkUpdateMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { milestoneIds, updates } = req.body;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const userMember = getUserProjectRole(project, req.user.id);
    if (!userMember || (!userMember.permissions.canAssignTasks && userMember.role === 'teamMember')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update milestones'
      });
    }

    const result = await Milestone.updateMany(
      { 
        _id: { $in: milestoneIds },
        project: projectId 
      },
      { 
        ...updates,
        updatedBy: req.user.id,
        updatedAt: new Date()
      }
    );

    // Emit real-time update
    socketService.emitToProject(projectId, 'milestones:bulk_updated', {
      milestoneIds,
      updates,
      updatedBy: req.user.name,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} milestones updated successfully`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get milestone timeline with Gantt chart data
 * @route   GET /api/v1/projects/:projectId/milestones/timeline/gantt
 * @access  Private
 */
exports.getMilestoneGanttData = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project access
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
        error: 'Not authorized to view this project'
      });
    }

    const milestones = await Milestone.find({ project: projectId })
      .populate('dependencies', 'title startDate dueDate')
      .sort({ startDate: 1 });

    const ganttData = milestones.map(milestone => ({
      id: milestone._id,
      title: milestone.title,
      start: milestone.startDate,
      end: milestone.dueDate,
      progress: milestone.progress,
      status: milestone.status,
      priority: milestone.priority,
      dependencies: milestone.dependencies.map(dep => dep._id),
      assignedTo: milestone.assignedTo,
      color: {
        'high': '#ef4444',
        'medium': '#f59e0b',
        'low': '#10b981'
      }[milestone.priority] || '#6b7280'
    }));

    res.json({
      success: true,
      data: ganttData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectMilestones: exports.getProjectMilestones,
  createMilestone: exports.createMilestone,
  updateMilestone: exports.updateMilestone,
  deleteMilestone: exports.deleteMilestone,
  getMilestoneTimeline: exports.getMilestoneTimeline,
  linkTasksToMilestone: exports.linkTasksToMilestone,
  getMilestoneAnalytics: exports.getMilestoneAnalytics,
  getMilestoneDetails: exports.getMilestoneDetails,
  updateMilestoneProgress: exports.updateMilestoneProgress,
  bulkUpdateMilestones: exports.bulkUpdateMilestones,
  getMilestoneGanttData: exports.getMilestoneGanttData
};
