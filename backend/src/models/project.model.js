const mongoose = require('mongoose');

const ProjectMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['supervisor', 'team-lead', 'team-member'],
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  permissions: {
    canAssignTasks: { type: Boolean, default: false },
    canEditProject: { type: Boolean, default: false },
    canManageMembers: { type: Boolean, default: false },
    canDeleteProject: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true }
  }
});

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
    maxlength: [1000, 'Description can not be more than 1000 characters']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  priorityLevel: {
    type: String,
    required: [true, 'Please add a priority level'],
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  members: [ProjectMemberSchema],
  settings: {
    allowMemberInvite: { type: Boolean, default: false },
    requireApprovalForTasks: { type: Boolean, default: false },
    enableNotifications: { type: Boolean, default: true },
    visibilityLevel: {
      type: String,
      enum: ['private', 'team', 'organization'],
      default: 'team'
    }
  },
  resources: [{
    name: String,
    type: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
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

// Set permissions based on role
ProjectMemberSchema.pre('save', function(next) {
  const role = this.role;
  
  switch(role) {
    case 'supervisor':
      this.permissions = {
        canAssignTasks: true,
        canEditProject: true,
        canManageMembers: true,
        canDeleteProject: true,
        canViewReports: true
      };
      break;
    case 'team-lead':
      this.permissions = {
        canAssignTasks: true,
        canEditProject: false,
        canManageMembers: false,
        canDeleteProject: false,
        canViewReports: true
      };
      break;
    case 'team-member':
      this.permissions = {
        canAssignTasks: false,
        canEditProject: false,
        canManageMembers: false,
        canDeleteProject: false,
        canViewReports: true
      };
      break;
  }
  next();
});

// Method to check if user has specific permission in project
ProjectSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member && member.permissions[permission];
};

// Method to get user's role in project
ProjectSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

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
