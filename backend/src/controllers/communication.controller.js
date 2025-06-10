const mongoose = require('mongoose');
const Project = require('../models/project.model');
const Discussion = require('../models/discussion.model');
const socketService = require('../services/socketService');
const Notification = require('../models/notification.model');

// Message Schema for real-time chat
const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot be more than 2000 characters']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system', 'mention'],
    default: 'text'
  },
  mentions: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['user', 'all', 'role'],
      default: 'user'
    }
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    mimeType: String
  }],
  editedAt: Date,
  edited: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Message = mongoose.model('Message', MessageSchema);

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
 * @desc    Get project discussions
 * @route   GET /api/v1/projects/:projectId/discussions
 * @access  Private
 */
exports.getProjectDiscussions = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 10, category } = req.query;

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
    if (category) query.category = category;

    const discussions = await Discussion.find(query)
      .populate('author', 'name email avatar')
      .populate('participants', 'name email avatar')
      .populate('lastMessage.author', 'name')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Discussion.countDocuments(query);

    res.status(200).json({
      success: true,
      count: discussions.length,
      data: discussions,
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
 * @desc    Create a new discussion
 * @route   POST /api/v1/projects/:projectId/discussions
 * @access  Private
 */
exports.createDiscussion = async (req, res, next) => {
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
        error: 'Not authorized to create discussions in this project'
      });
    }

    const discussionData = {
      ...req.body,
      project: projectId,
      author: req.user.id,
      participants: [req.user.id] // Add creator as participant
    };

    const discussion = await Discussion.create(discussionData);
    await discussion.populate([
      { path: 'author', select: 'name email avatar' },
      { path: 'participants', select: 'name email avatar' }
    ]);

    // Emit real-time update
    socketService.emitToProject(projectId, 'discussion:created', {
      discussion: discussion,
      createdBy: req.user.name,
      timestamp: new Date()
    });

    // Create notifications for project members
    const memberIds = project.members
      .filter(member => (member.user._id || member.user).toString() !== req.user.id)
      .map(member => member.user._id || member.user);

    if (memberIds.length > 0) {
      const Notification = require('../models/notification.model');
      const notifications = [];
      
      for (const memberId of memberIds) {
        notifications.push({
          title: 'New Discussion',
          message: `New discussion "${discussion.title}" started in ${project.title}`,
          type: 'discussion_created',
          recipient: memberId,
          sender: req.user.id,
          relatedProject: projectId,
          relatedDiscussion: discussion._id,
          actionUrl: `/projects/${projectId}/discussions/${discussion._id}`,
          metadata: { discussionTitle: discussion.title }
        });
      }
      
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real-time messages for a project
 * @route   GET /api/v1/projects/:projectId/messages
 * @access  Private
 */
exports.getProjectMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;

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
        error: 'Not authorized to view messages in this project'
      });
    }

    // Build query
    let query = { project: projectId };
    
    if (before) {
      query.createdAt = { ...query.createdAt, $lt: new Date(before) };
    }
    if (after) {
      query.createdAt = { ...query.createdAt, $gt: new Date(after) };
    }

    const messages = await Message.find(query)
      .populate('author', 'name email avatar')
      .populate('mentions.user', 'name')
      .populate('replyTo', 'content author')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read by current user
    const unreadMessageIds = messages
      .filter(msg => !msg.readBy.some(read => read.user.toString() === req.user.id))
      .map(msg => msg._id);

    if (unreadMessageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessageIds } },
        { 
          $push: { 
            readBy: { 
              user: req.user.id, 
              readAt: new Date() 
            } 
          } 
        }
      );
    }

    const total = await Message.countDocuments({ project: projectId });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse(), // Return in chronological order
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
 * @desc    Send a message to project chat
 * @route   POST /api/v1/projects/:projectId/messages
 * @access  Private
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { content, messageType = 'text', mentions = [], replyTo, attachments = [] } = req.body;

    // Verify project access
    const project = await Project.findById(projectId).populate('members.user', 'name email');
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
        error: 'Not authorized to send messages in this project'
      });
    }

    const messageData = {
      content,
      author: req.user.id,
      project: projectId,
      messageType,
      mentions,
      attachments,
      replyTo: replyTo || undefined,
      readBy: [{ user: req.user.id, readAt: new Date() }] // Mark as read by sender
    };

    const message = await Message.create(messageData);
    await message.populate([
      { path: 'author', select: 'name email avatar' },
      { path: 'mentions.user', select: 'name' },
      { path: 'replyTo', select: 'content author' }
    ]);

    // Emit real-time message
    socketService.emitToProject(projectId, 'message:new', {
      message: message,
      timestamp: new Date()
    });

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
      const Notification = require('../models/notification.model');
      const mentionedUserIds = mentions
        .filter(mention => mention.type === 'user')
        .map(mention => mention.user);

      if (mentionedUserIds.length > 0) {
        const notifications = [];
        for (const userId of mentionedUserIds) {
          notifications.push({
            title: 'You were mentioned',
            message: `${req.user.name} mentioned you in ${project.title}`,
            type: 'discussion_reply', // Using existing enum value
            recipient: userId,
            sender: req.user.id,
            relatedProject: projectId,
            actionUrl: `/projects/${projectId}/messages`,
            metadata: { 
              messageId: message._id,
              content: content.substring(0, 100) 
            }
          });
        }
        await Notification.insertMany(notifications);
      }

      // Handle @all mentions
      if (mentions.some(mention => mention.type === 'all')) {
        const allMemberIds = project.members
          .filter(member => (member.user._id || member.user).toString() !== req.user.id)
          .map(member => member.user._id || member.user);

        const allNotifications = [];
        for (const userId of allMemberIds) {
          allNotifications.push({
            title: 'Everyone was mentioned',
            message: `${req.user.name} mentioned everyone in ${project.title}`,
            type: 'discussion_reply', // Using existing enum value
            recipient: userId,
            sender: req.user.id,
            relatedProject: projectId,
            actionUrl: `/projects/${projectId}/messages`,
            metadata: { 
              messageId: message._id,
              content: content.substring(0, 100) 
            }
          });
        }
        if (allNotifications.length > 0) {
          await Notification.insertMany(allNotifications);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit a message
 * @route   PUT /api/v1/projects/:projectId/messages/:messageId
 * @access  Private (Author only)
 */
exports.editMessage = async (req, res, next) => {
  try {
    const { projectId, messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user is the author
    if (message.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this message'
      });
    }

    // Don't allow editing messages older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit messages older than 15 minutes'
      });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate([
      { path: 'author', select: 'name email avatar' },
      { path: 'mentions.user', select: 'name' }
    ]);

    // Emit real-time update
    socketService.emitToProject(projectId, 'message:edited', {
      message: message,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/v1/projects/:projectId/messages/:messageId
 * @access  Private (Author/Supervisor)
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { projectId, messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Verify project access
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);

    // Check if user can delete (author or supervisor)
    const canDelete = message.author.toString() === req.user.id ||
                     (userMember && userMember.role === 'supervisor');

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    await Message.findByIdAndDelete(messageId);

    // Emit real-time update
    socketService.emitToProject(projectId, 'message:deleted', {
      messageId: messageId,
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
 * @desc    Add reaction to message
 * @route   POST /api/v1/projects/:projectId/messages/:messageId/reactions
 * @access  Private
 */
exports.addMessageReaction = async (req, res, next) => {
  try {
    const { projectId, messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      reaction => reaction.user.toString() === req.user.id && reaction.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        reaction => !(reaction.user.toString() === req.user.id && reaction.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        user: req.user.id,
        emoji: emoji,
        timestamp: new Date()
      });
    }

    await message.save();
    await message.populate('reactions.user', 'name');

    // Emit real-time update
    socketService.emitToProject(projectId, 'message:reaction', {
      messageId: messageId,
      reactions: message.reactions,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      data: message.reactions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project activity feed
 * @route   GET /api/v1/projects/:projectId/activity
 * @access  Private
 */
exports.getProjectActivity = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { limit = 20, page = 1, types } = req.query;

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

    // Get activities from various sources
    const [tasks, discussions, messages, milestones] = await Promise.all([
      // Recent task activities
      require('../models/task.model').find({ project: projectId })
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 })
        .limit(20),
      
      // Recent discussions
      Discussion.find({ project: projectId })
        .populate('author', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
      
      // Recent messages (if types includes messages)
      types && types.includes('messages') ? 
        Message.find({ project: projectId })
          .populate('author', 'name')
          .sort({ createdAt: -1 })
          .limit(10) : [],
      
      // Recent milestones
      mongoose.model('Milestone').find({ project: projectId })
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 })
        .limit(10)
        .catch(() => []) // Handle if milestone model doesn't exist yet
    ]);

    // Combine and format activities
    const activities = [
      ...tasks.map(task => ({
        type: 'task',
        id: task._id,
        title: task.title,
        action: task.status === 'completed' ? 'completed' : 'updated',
        user: task.assignedTo || task.createdBy,
        timestamp: task.updatedAt,
        data: { status: task.status, priority: task.priority }
      })),
      ...discussions.map(discussion => ({
        type: 'discussion',
        id: discussion._id,
        title: discussion.title,
        action: 'created',
        user: discussion.author,
        timestamp: discussion.createdAt,
        data: { category: discussion.category }
      })),
      ...messages.map(message => ({
        type: 'message',
        id: message._id,
        title: message.content.substring(0, 50) + '...',
        action: 'sent',
        user: message.author,
        timestamp: message.createdAt,
        data: { messageType: message.messageType }
      })),
      ...milestones.map(milestone => ({
        type: 'milestone',
        id: milestone._id,
        title: milestone.title,
        action: milestone.status === 'completed' ? 'completed' : 'updated',
        user: milestone.assignedTo?.[0] || milestone.createdBy,
        timestamp: milestone.updatedAt,
        data: { status: milestone.status, progress: milestone.progress }
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

/**
 * @desc    Update typing status
 * @route   POST /api/v1/projects/:projectId/typing
 * @access  Private
 */
exports.updateTypingStatus = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { isTyping } = req.body;

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

    // Emit typing status
    if (isTyping) {
      socketService.emitToProject(projectId, 'user:typing', {
        userId: req.user.id,
        userName: req.user.name,
        timestamp: new Date()
      });
    } else {
      socketService.emitToProject(projectId, 'user:stop_typing', {
        userId: req.user.id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: { isTyping }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectDiscussions: exports.getProjectDiscussions,
  createDiscussion: exports.createDiscussion,
  getProjectMessages: exports.getProjectMessages,
  sendMessage: exports.sendMessage,
  editMessage: exports.editMessage,
  deleteMessage: exports.deleteMessage,
  addMessageReaction: exports.addMessageReaction,
  getProjectActivity: exports.getProjectActivity,
  updateTypingStatus: exports.updateTypingStatus
};
