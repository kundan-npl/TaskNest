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
        origin: process.env.CLIENT_URL || "http://localhost:5173",
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
}

module.exports = new SocketService();
