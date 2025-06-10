const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const Project = require('../models/project.model');

/**
 * @desc    Get all notifications for user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    let query = { recipient: req.user.id };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('relatedProject', 'name description')
      .populate('relatedTask', 'title description')
      .populate('relatedUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(startIndex);

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Pagination info
    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      pagination,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notification counts
 * @route   GET /api/v1/notifications/counts
 * @access  Private
 */
exports.getNotificationCounts = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    const totalCount = await Notification.countDocuments({
      recipient: req.user.id
    });

    res.status(200).json({
      success: true,
      data: {
        unread: unreadCount,
        total: totalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      data: { message: 'All notifications marked as read' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/v1/notifications/read
 * @access  Private
 */
exports.deleteReadNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user.id,
      isRead: true
    });

    res.status(200).json({
      success: true,
      data: { 
        message: `${result.deletedCount} notifications deleted`,
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create notification (Helper function for internal use)
 * @param   {Object} notificationData
 * @access  Internal
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * @desc    Create notifications for project members
 * @param   {String} projectId
 * @param   {Object} notificationData
 * @param   {Array} excludeUsers - User IDs to exclude from notification
 * @access  Internal
 */
exports.notifyProjectMembers = async (projectId, notificationData, excludeUsers = []) => {
  try {
    const project = await Project.findById(projectId).populate('members.user');
    
    if (!project) {
      throw new Error('Project not found');
    }

    const notifications = [];
    
    for (const member of project.members) {
      if (!excludeUsers.includes(member.user._id.toString())) {
        notifications.push({
          ...notificationData,
          recipient: member.user._id,
          relatedProject: projectId
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications;
  } catch (error) {
    console.error('Error notifying project members:', error);
    throw error;
  }
};

/**
 * @desc    Create notifications for task assignees
 * @param   {Array} assigneeIds
 * @param   {Object} notificationData
 * @param   {Array} excludeUsers
 * @access  Internal
 */
exports.notifyTaskAssignees = async (assigneeIds, notificationData, excludeUsers = []) => {
  try {
    const notifications = [];
    
    for (const assigneeId of assigneeIds) {
      if (!excludeUsers.includes(assigneeId.toString())) {
        notifications.push({
          ...notificationData,
          recipient: assigneeId
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return notifications;
  } catch (error) {
    console.error('Error notifying task assignees:', error);
    throw error;
  }
};

/**
 * @desc    Get project-specific notifications
 * @route   GET /api/v1/projects/:projectId/notifications
 * @access  Private
 */
exports.getProjectNotifications = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20, unread, types } = req.query;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is a member
    const userMember = project.members.find(member => {
      const memberUserId = member.user._id || member.user;
      return memberUserId.toString() === req.user.id;
    });

    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view notifications for this project'
      });
    }

    // Build query
    let query = {
      recipient: req.user.id,
      relatedProject: projectId
    };

    if (unread === 'true') {
      query.isRead = false;
    }

    if (types) {
      const typeArray = types.split(',');
      query.type = { $in: typeArray };
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update notification preferences for a project
 * @route   PUT /api/v1/projects/:projectId/notifications/preferences
 * @access  Private
 */
exports.updateProjectNotificationPreferences = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const preferences = req.body;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is a member
    const userMember = project.members.find(member => {
      const memberUserId = member.user._id || member.user;
      return memberUserId.toString() === req.user.id;
    });

    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update preferences for this project'
      });
    }

    // Update user's notification preferences for this project
    const User = require('../models/user.model');
    const user = await User.findById(req.user.id);
    
    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }
    if (!user.notificationPreferences.projects) {
      user.notificationPreferences.projects = {};
    }

    user.notificationPreferences.projects[projectId] = {
      ...user.notificationPreferences.projects[projectId],
      ...preferences,
      updatedAt: new Date()
    };

    await user.save();

    res.status(200).json({
      success: true,
      data: user.notificationPreferences.projects[projectId]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notification preferences for a project
 * @route   GET /api/v1/projects/:projectId/notifications/preferences
 * @access  Private
 */
exports.getProjectNotificationPreferences = async (req, res, next) => {
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

    // Check if user is a member
    const userMember = project.members.find(member => {
      const memberUserId = member.user._id || member.user;
      return memberUserId.toString() === req.user.id;
    });

    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view preferences for this project'
      });
    }

    const User = require('../models/user.model');
    const user = await User.findById(req.user.id);

    // Default preferences if none exist
    const defaultPreferences = {
      taskUpdates: true,
      projectUpdates: true,
      newMessages: true,
      mentions: true,
      deadlineReminders: true,
      milestoneUpdates: true,
      memberChanges: true,
      discussionUpdates: false
    };

    const preferences = user.notificationPreferences?.projects?.[projectId] || defaultPreferences;

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark project notifications as read
 * @route   PUT /api/v1/projects/:projectId/notifications/mark-read
 * @access  Private
 */
exports.markProjectNotificationsAsRead = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { notificationIds } = req.body;

    // Verify project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    let query = {
      recipient: req.user.id,
      relatedProject: projectId,
      isRead: false
    };

    // If specific notification IDs provided, filter by them
    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }

    const result = await Notification.updateMany(
      query,
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} notifications marked as read`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notification statistics for project
 * @route   GET /api/v1/projects/:projectId/notifications/stats
 * @access  Private
 */
exports.getProjectNotificationStats = async (req, res, next) => {
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

    const [totalCount, unreadCount, typeStats] = await Promise.all([
      // Total notifications for this project
      Notification.countDocuments({
        recipient: req.user.id,
        relatedProject: projectId
      }),
      
      // Unread notifications
      Notification.countDocuments({
        recipient: req.user.id,
        relatedProject: projectId,
        isRead: false
      }),
      
      // Count by notification type
      Notification.aggregate([
        {
          $match: {
            recipient: req.user.id,
            relatedProject: new mongoose.Types.ObjectId(projectId)
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $eq: ['$isRead', false] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        unread: unreadCount,
        typeBreakdown: typeStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create project-specific notification
 * @route   POST /api/v1/projects/:projectId/notifications
 * @access  Private (Team Lead/Supervisor)
 */
exports.createProjectNotification = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message, type = 'project_announcement', targetUsers, priority = 'normal' } = req.body;

    // Verify project access and permissions
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const userMember = project.members.find(member => {
      const memberUserId = member.user._id || member.user;
      return memberUserId.toString() === req.user.id;
    });

    if (!userMember || (userMember.role === 'teamMember' && !userMember.permissions.canManageMembers)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create notifications for this project'
      });
    }

    // Determine target users
    let users = targetUsers;
    if (!users || users.length === 0) {
      // Send to all project members
      users = project.members.map(member => member.user._id || member.user);
    }

    // Create notifications for target users
    const notifications = [];
    for (const userId of users) {
      notifications.push({
        title: 'Project Notification',
        message,
        type,
        recipient: userId,
        sender: req.user.id,
        relatedProject: projectId,
        priority,
        actionUrl: `/projects/${projectId}`,
        metadata: {
          projectTitle: project.title,
          createdBy: req.user.name
        }
      });
    }

    const createdNotifications = await Notification.insertMany(notifications);
    const notification = createdNotifications[0]; // Return first one for response

    // Emit real-time notification
    const socketService = require('../services/socketService');
    socketService.emitToProject(projectId, 'notification:new', {
      notification,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};
