const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
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
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  priorityLevel: {
    type: String,
    required: [true, 'Please add a priority level'],
    enum: ['Low', 'Medium', 'High', 'Urgent']
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Cascade delete tasks when a project is deleted
ProjectSchema.pre('remove', async function(next) {
  await this.model('Task').deleteMany({ project: this._id });
  next();
});

// Reverse populate with virtuals
ProjectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  justOne: false
});

module.exports = mongoose.model('Project', ProjectSchema);
