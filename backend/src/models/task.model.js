const mongoose = require('mongoose');

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
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['To-Do', 'In Progress', 'Done'],
    default: 'To-Do'
  },
  assignee: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
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
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  }],
  attachments: [{
    name: String,
    fileType: String,
    url: String,
    key: String // S3 key
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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
TaskSchema.index({ assignee: 1, dueDate: 1 });

// Reverse populate with virtuals for subtasks
TaskSchema.virtual('subtasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'parentTask',
  justOne: false
});

// Virtual field to check if task is overdue
TaskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'Done';
});

// Middleware to get the parent task and project details
TaskSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'assignee',
    select: 'name email profileImage'
  }).populate({
    path: 'createdBy',
    select: 'name email'
  });
  
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
