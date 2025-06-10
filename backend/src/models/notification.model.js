const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a notification title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Please add a notification message'],
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: [
      'task_assigned',
      'task_updated',
      'task_completed',
      'task_overdue',
      'project_created',
      'project_updated',
      'member_added',
      'member_removed',
      'discussion_created',
      'discussion_reply',
      'milestone_reached',
      'deadline_reminder',
      'system_announcement'
    ],
    required: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  relatedProject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  relatedTask: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  },
  relatedDiscussion: {
    type: mongoose.Schema.ObjectId,
    ref: 'Discussion'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  return await this.create(data);
};

// Static method to mark multiple notifications as read
NotificationSchema.statics.markMultipleAsRead = async function(notificationIds, userId) {
  return await this.updateMany(
    { _id: { $in: notificationIds }, recipient: userId },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, isRead: false });
};

// Middleware to populate related entities
NotificationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'relatedProject',
    select: 'name'
  }).populate({
    path: 'relatedTask',
    select: 'title'
  });
  
  next();
});

module.exports = mongoose.model('Notification', NotificationSchema);
