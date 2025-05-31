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

    let query = { user: req.user.id };
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
      user: req.user.id,
      isRead: false
    });

    const totalCount = await Notification.countDocuments({
      user: req.user.id
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
      { _id: req.params.id, user: req.user.id },
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
      { user: req.user.id, isRead: false },
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
      user: req.user.id
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
      user: req.user.id,
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
          user: member.user._id,
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
          user: assigneeId
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
