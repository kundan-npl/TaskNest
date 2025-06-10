const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map of userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      
      // Join user to their personal room for private notifications
      socket.join(`user_${socket.userId}`);
      
      // Handle joining project rooms
      socket.on('join_project', (projectId) => {
        socket.join(`project_${projectId}`);
        console.log(`User ${socket.user.name} joined project room: ${projectId}`);
      });

      // Handle leaving project rooms
      socket.on('leave_project', (projectId) => {
        socket.leave(`project_${projectId}`);
        console.log(`User ${socket.user.name} left project room: ${projectId}`);
      });

      // Handle real-time task updates
      socket.on('task_update', (data) => {
        // Broadcast task update to all project members
        socket.to(`project_${data.projectId}`).emit('task_updated', {
          taskId: data.taskId,
          updateType: data.updateType,
          updatedBy: socket.user.name,
          timestamp: new Date()
        });
      });

      // Handle real-time discussion updates
      socket.on('new_message', (data) => {
        // Broadcast new message to project room
        socket.to(`project_${data.projectId}`).emit('message_received', {
          discussionId: data.discussionId,
          message: data.message,
          author: {
            id: socket.userId,
            name: socket.user.name,
            avatar: socket.user.profileImage
          },
          timestamp: new Date()
        });
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(`project_${data.projectId}`).emit('user_typing', {
          userId: socket.userId,
          userName: socket.user.name,
          discussionId: data.discussionId
        });
      });

      socket.on('typing_stop', (data) => {
        socket.to(`project_${data.projectId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          discussionId: data.discussionId
        });
      });

      // Handle user presence updates
      socket.on('update_presence', (status) => {
        // Update user status in database and broadcast to relevant projects
        this.updateUserPresence(socket.userId, status);
      });

      // Setup dashboard-specific events
      this.setupDashboardEvents(socket);
      // Setup widget-specific events
      this.setupWidgetEvents(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected`);
        this.connectedUsers.delete(socket.userId);
        
        // Broadcast offline status to relevant project rooms
        this.broadcastUserStatus(socket.userId, 'offline');
      });
    });

    console.log('Socket.IO server initialized');
    return this.io;
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(`user_${userId}`).emit('new_notification', notification);
      return true;
    }
    return false; // User not connected
  }

  // Send notification to all project members
  sendNotificationToProject(projectId, notification, excludeUserId = null) {
    if (excludeUserId) {
      // Send to project room excluding the sender
      this.io.to(`project_${projectId}`).except(`user_${excludeUserId}`).emit('project_notification', notification);
    } else {
      this.io.to(`project_${projectId}`).emit('project_notification', notification);
    }
  }

  // Broadcast task status change
  broadcastTaskUpdate(projectId, taskUpdate) {
    this.io.to(`project_${projectId}`).emit('task_status_changed', taskUpdate);
  }

  // Broadcast new comment on task
  broadcastTaskComment(projectId, commentData) {
    this.io.to(`project_${projectId}`).emit('new_task_comment', commentData);
  }

  // Broadcast project member added/removed
  broadcastMemberUpdate(projectId, memberUpdate) {
    this.io.to(`project_${projectId}`).emit('member_update', memberUpdate);
  }

  // Update and broadcast user presence
  async updateUserPresence(userId, status) {
    try {
      await User.findByIdAndUpdate(userId, { 
        lastSeen: new Date(),
        isOnline: status === 'online'
      });

      this.broadcastUserStatus(userId, status);
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  // Broadcast user status to all relevant project rooms
  broadcastUserStatus(userId, status) {
    // This would need to get user's projects and broadcast to those rooms
    // For now, broadcast to all connected sockets
    this.io.emit('user_status_changed', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  // Get list of online users in a project
  getOnlineUsersInProject(projectId) {
    const room = this.io.sockets.adapter.rooms.get(`project_${projectId}`);
    const onlineUsers = [];
    
    if (room) {
      room.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && socket.user) {
          onlineUsers.push({
            id: socket.userId,
            name: socket.user.name,
            avatar: socket.user.profileImage
          });
        }
      });
    }
    
    return onlineUsers;
  }

  // Send system-wide announcement (admin only)
  sendSystemAnnouncement(announcement) {
    this.io.emit('system_announcement', {
      ...announcement,
      timestamp: new Date()
    });
  }

  // Dashboard-specific real-time events
  broadcastDashboardUpdate(userId, updateType, data) {
    // Send to user's personal room
    this.io.to(`user_${userId}`).emit('dashboard_update', {
      type: updateType,
      data,
      timestamp: new Date()
    });
  }

  // Broadcast project statistics update to project members
  broadcastProjectStatsUpdate(projectId, stats) {
    this.io.to(`project_${projectId}`).emit('project_stats_update', {
      projectId,
      stats,
      timestamp: new Date()
    });
  }

  // Broadcast task statistics update
  broadcastTaskStatsUpdate(userId, stats) {
    this.io.to(`user_${userId}`).emit('task_stats_update', {
      stats,
      timestamp: new Date()
    });
  }

  // Broadcast system-wide statistics (admin dashboard)
  broadcastSystemStats(stats) {
    // Send to all admin users
    this.io.emit('system_stats_update', {
      stats,
      timestamp: new Date()
    });
  }

  // Send real-time activity feed update
  broadcastActivityUpdate(userId, activity) {
    this.io.to(`user_${userId}`).emit('activity_update', {
      activity,
      timestamp: new Date()
    });
  }

  // Broadcast performance metrics update
  broadcastPerformanceUpdate(userId, metrics) {
    this.io.to(`user_${userId}`).emit('performance_update', {
      metrics,
      timestamp: new Date()
    });
  }

  // Get dashboard real-time data for a user
  getDashboardRealtimeData(userId) {
    return {
      isOnline: this.connectedUsers.has(userId.toString()),
      lastSeen: new Date(),
      onlineUsers: Array.from(this.connectedUsers.keys()).length
    };
  }

  // Dashboard event handlers for socket connections
  setupDashboardEvents(socket) {
    // Join dashboard room for real-time updates
    socket.on('join_dashboard', () => {
      socket.join(`dashboard_${socket.userId}`);
      console.log(`User ${socket.user.name} joined dashboard room`);
    });

    // Leave dashboard room
    socket.on('leave_dashboard', () => {
      socket.leave(`dashboard_${socket.userId}`);
      console.log(`User ${socket.user.name} left dashboard room`);
    });

    // Request dashboard refresh
    socket.on('refresh_dashboard', () => {
      // Emit refresh event to trigger frontend data fetch
      socket.emit('dashboard_refresh_requested', {
        timestamp: new Date()
      });
    });

    // Handle dashboard activity tracking
    socket.on('dashboard_activity', (activity) => {
      // Track user activity for analytics
      this.trackDashboardActivity(socket.userId, activity);
    });
  }

  // Widget-specific event handlers
  setupWidgetEvents(socket) {
    // Task Management Widget Events
    socket.on('task:update_status', (data) => {
      this.emitProjectEvent(data.projectId, 'task:status_changed', {
        taskId: data.taskId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        updatedBy: socket.user.name
      });
    });

    socket.on('task:assign', (data) => {
      this.emitProjectEvent(data.projectId, 'task:assigned', {
        taskId: data.taskId,
        assignedTo: data.assignedTo,
        assignedBy: socket.user.name
      });
    });

    socket.on('task:comment', (data) => {
      this.emitProjectEvent(data.projectId, 'task:comment_added', {
        taskId: data.taskId,
        comment: data.comment,
        author: socket.user.name
      });
    });

    // Communication Widget Events
    socket.on('message:send', (data) => {
      this.emitMessageEvent(data.projectId, 'message:new', {
        message: data.message,
        author: {
          id: socket.userId,
          name: socket.user.name,
          avatar: socket.user.avatar
        }
      });
    });

    socket.on('message:edit', (data) => {
      this.emitMessageEvent(data.projectId, 'message:edited', {
        messageId: data.messageId,
        newContent: data.content,
        editedBy: socket.user.name
      });
    });

    socket.on('message:react', (data) => {
      this.emitMessageEvent(data.projectId, 'message:reaction_added', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('discussion:create', (data) => {
      this.emitMessageEvent(data.projectId, 'discussion:created', {
        discussion: data.discussion,
        createdBy: socket.user.name
      });
    });

    // File Management Widget Events
    socket.on('file:upload', (data) => {
      this.emitFileEvent(data.projectId, 'file:uploaded', {
        file: data.file,
        uploadedBy: socket.user.name
      });
    });

    socket.on('file:delete', (data) => {
      this.emitFileEvent(data.projectId, 'file:deleted', {
        fileId: data.fileId,
        fileName: data.fileName,
        deletedBy: socket.user.name
      });
    });

    socket.on('file:share', (data) => {
      this.emitFileEvent(data.projectId, 'file:shared', {
        fileId: data.fileId,
        sharedWith: data.users,
        sharedBy: socket.user.name
      });
    });

    socket.on('file:comment', (data) => {
      this.emitFileEvent(data.projectId, 'file:comment_added', {
        fileId: data.fileId,
        comment: data.comment,
        author: socket.user.name
      });
    });

    // Milestone Widget Events
    socket.on('milestone:create', (data) => {
      this.emitMilestoneEvent(data.projectId, 'milestone:created', {
        milestone: data.milestone,
        createdBy: socket.user.name
      });
    });

    socket.on('milestone:update', (data) => {
      this.emitMilestoneEvent(data.projectId, 'milestone:updated', {
        milestoneId: data.milestoneId,
        updates: data.updates,
        updatedBy: socket.user.name
      });
    });

    socket.on('milestone:progress', (data) => {
      this.emitMilestoneEvent(data.projectId, 'milestone:progress_updated', {
        milestoneId: data.milestoneId,
        oldProgress: data.oldProgress,
        newProgress: data.newProgress,
        updatedBy: socket.user.name
      });
    });

    socket.on('milestone:complete', (data) => {
      this.emitMilestoneEvent(data.projectId, 'milestone:completed', {
        milestoneId: data.milestoneId,
        completedBy: socket.user.name
      });
    });

    // Team Management Widget Events
    socket.on('team:member_add', (data) => {
      this.emitTeamEvent(data.projectId, 'team:member_added', {
        member: data.member,
        addedBy: socket.user.name
      });
    });

    socket.on('team:member_remove', (data) => {
      this.emitTeamEvent(data.projectId, 'team:member_removed', {
        memberId: data.memberId,
        memberName: data.memberName,
        removedBy: socket.user.name
      });
    });

    socket.on('team:role_change', (data) => {
      this.emitTeamEvent(data.projectId, 'team:role_changed', {
        memberId: data.memberId,
        oldRole: data.oldRole,
        newRole: data.newRole,
        changedBy: socket.user.name
      });
    });

    // Project Overview Widget Events
    socket.on('project:status_change', (data) => {
      this.emitProjectEvent(data.projectId, 'project:status_changed', {
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        changedBy: socket.user.name
      });
    });

    socket.on('project:update', (data) => {
      this.emitProjectEvent(data.projectId, 'project:updated', {
        updates: data.updates,
        updatedBy: socket.user.name
      });
    });

    // Notification Widget Events
    socket.on('notification:read', (data) => {
      this.emitNotificationEvent(socket.userId, 'notification:marked_read', {
        notificationId: data.notificationId
      });
    });

    socket.on('notification:snooze', (data) => {
      this.emitNotificationEvent(socket.userId, 'notification:snoozed', {
        notificationId: data.notificationId,
        snoozeUntil: data.snoozeUntil
      });
    });

    // Real-time collaboration events
    socket.on('user:cursor_move', (data) => {
      this.emitCollaborationEvent(data.projectId, 'user:cursor_moved', {
        userId: socket.userId,
        userName: socket.user.name,
        position: data.position,
        element: data.element
      });
    });

    socket.on('user:selection', (data) => {
      this.emitCollaborationEvent(data.projectId, 'user:selection_changed', {
        userId: socket.userId,
        userName: socket.user.name,
        selection: data.selection
      });
    });
  }

  // Enhanced communication events
  emitMessageEvent(projectId, eventType, data) {
    this.io.to(`project_${projectId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  // Enhanced file management events
  emitFileEvent(projectId, eventType, data) {
    this.io.to(`project_${projectId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  // Enhanced milestone events
  emitMilestoneEvent(projectId, eventType, data) {
    this.io.to(`project_${projectId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  // Enhanced notification events
  emitNotificationEvent(userId, eventType, data) {
    this.io.to(`user_${userId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  // Team management events
  emitTeamEvent(projectId, eventType, data) {
    this.io.to(`project_${projectId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  // Project overview events
  emitProjectEvent(projectId, eventType, data) {
    this.io.to(`project_${projectId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  // Real-time collaboration events
  emitCollaborationEvent(projectId, eventType, data) {
    this.io.to(`project_${projectId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  // Enhanced presence and activity tracking
  broadcastUserActivity(userId, projectId, activity) {
    this.io.to(`project_${projectId}`).emit('user:activity', {
      userId,
      activity,
      timestamp: new Date()
    });
  }

  // Real-time analytics updates
  broadcastAnalyticsUpdate(projectId, analyticsType, data) {
    this.io.to(`project_${projectId}`).emit('analytics:updated', {
      type: analyticsType,
      data,
      timestamp: new Date()
    });
  }

  // Widget refresh events
  requestWidgetRefresh(projectId, widgetType) {
    this.io.to(`project_${projectId}`).emit('widget:refresh_requested', {
      widgetType,
      timestamp: new Date()
    });
  }

  // Bulk operation events
  emitBulkOperationEvent(projectId, operationType, data) {
    this.io.to(`project_${projectId}`).emit('bulk_operation:completed', {
      operationType,
      ...data,
      timestamp: new Date()
    });
  }

  // Generic method to emit events to project room
  emitToProject(projectId, eventName, data) {
    this.io.to(`project_${projectId}`).emit(eventName, data);
  }

  // Track dashboard activity for analytics
  trackDashboardActivity(userId, activity) {
    // This could store activity in database for analytics
    console.log(`Dashboard activity from user ${userId}:`, activity);
  }
}

module.exports = new SocketService();
