const mongoose = require('mongoose');

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

// Update status based on progress
MilestoneSchema.pre('save', function(next) {
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.progress > 0 && this.status === 'not-started') {
    this.status = 'in-progress';
  }
  
  // Check if overdue
  if (this.dueDate && this.dueDate < new Date() && this.status !== 'completed') {
    this.status = 'overdue';
  }
  
  next();
});

// Virtual for calculating if milestone is overdue
MilestoneSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'completed';
});

// Virtual for time remaining
MilestoneSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate || this.status === 'completed') return null;
  
  const now = new Date();
  const timeLeft = this.dueDate - now;
  
  if (timeLeft < 0) return 'Overdue';
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} days left`;
  
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  return `${hours} hours left`;
});

module.exports = mongoose.model('Milestone', MilestoneSchema);
