const mongoose = require('mongoose');
const Project = require('../models/project.model');
const socketService = require('../services/socketService');
const { createNotification } = require('./notification.controller');

// Milestone Schema (we'll add this to the project model later)
const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a milestone title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'overdue'],
    default: 'not-started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  dependencies: [{
    milestone: {
      type: mongoose.Schema.ObjectId,
      ref: 'Milestone'
    },
    type: {
      type: String,
      enum: ['blocks', 'depends-on'],
      default: 'depends-on'
    }
  }],
  tasks: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  }],
  completedAt: Date,
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Milestone = mongoose.model('Milestone', MilestoneSchema);

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
          const Task = require('../models/task.model');
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
      await createNotification({
        type: 'milestone_assigned',
        message: `You have been assigned to milestone "${milestone.title}"`,
        users: milestone.assignedTo.map(user => user._id),
        data: { 
          projectId: projectId, 
          milestoneId: milestone._id,
          dueDate: milestone.dueDate 
        }
      });
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
      await createNotification({
        type: 'milestone_completed',
        message: `Milestone "${updatedMilestone.title}" has been completed`,
        users: project.members.map(member => member.user._id || member.user),
        data: { 
          projectId: projectId, 
          milestoneId: updatedMilestone._id,
          completedBy: req.user.name
        }
      });
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

module.exports = {
  getProjectMilestones: exports.getProjectMilestones,
  createMilestone: exports.createMilestone,
  updateMilestone: exports.updateMilestone,
  deleteMilestone: exports.deleteMilestone,
  getMilestoneTimeline: exports.getMilestoneTimeline,
  linkTasksToMilestone: exports.linkTasksToMilestone
};
