const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title can not be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description can not be more than 1000 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'done', 'cancelled'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  parentTask: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  },
  dependencies: [{
    task: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task'
    },
    type: {
      type: String,
      enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'],
      default: 'finish-to-start'
    }
  }],
  attachments: [{
    name: String,
    fileType: String,
    url: String,
    key: String, // S3 key
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [CommentSchema],
  watchers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  tags: [String],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ 'assignedTo.user': 1, dueDate: 1 });
TaskSchema.index({ createdBy: 1 });

// Reverse populate with virtuals for subtasks
TaskSchema.virtual('subtasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'parentTask',
  justOne: false
});

// Virtual field to check if task is overdue
TaskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'done';
});

// Method to add comment
TaskSchema.methods.addComment = function(content, authorId, attachments = []) {
  this.comments.push({
    content,
    author: authorId,
    attachments
  });
  return this.save();
};

// Method to update progress
TaskSchema.methods.updateProgress = function(percentage, userId) {
  this.completionPercentage = Math.min(100, Math.max(0, percentage));
  this.lastUpdatedBy = userId;
  
  // Auto-update status based on progress
  if (percentage === 0) {
    this.status = 'todo';
  } else if (percentage === 100) {
    this.status = 'done';
  } else if (this.status === 'todo') {
    this.status = 'in-progress';
  }
  
  return this.save();
};

// Middleware to populate necessary fields
TaskSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'assignedTo.user',
    select: 'name email profileImage'
  }).populate({
    path: 'assignedTo.assignedBy',
    select: 'name email'
  }).populate({
    path: 'createdBy',
    select: 'name email'
  }).populate({
    path: 'comments.author',
    select: 'name email profileImage'
  });
  
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
