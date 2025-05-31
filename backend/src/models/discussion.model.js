const mongoose = require('mongoose');

const DiscussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a discussion title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add discussion content'],
    maxlength: [2000, 'Content cannot be more than 2000 characters']
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'announcement', 'question', 'issue', 'suggestion'],
    default: 'general'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  tags: [String],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Reply cannot be more than 1000 characters']
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
    likes: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
DiscussionSchema.index({ project: 1, createdAt: -1 });
DiscussionSchema.index({ author: 1 });
DiscussionSchema.index({ category: 1 });

// Virtual for reply count
DiscussionSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Virtual for like count
DiscussionSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Method to add reply
DiscussionSchema.methods.addReply = function(content, authorId, attachments = []) {
  this.replies.push({
    content,
    author: authorId,
    attachments
  });
  return this.save();
};

// Method to toggle like
DiscussionSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// Method to add view
DiscussionSchema.methods.addView = function(userId) {
  const existingView = this.views.find(view => view.user.toString() === userId.toString());
  
  if (!existingView) {
    this.views.push({ user: userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Middleware to populate author and replies
DiscussionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'name email profileImage'
  }).populate({
    path: 'replies.author',
    select: 'name email profileImage'
  });
  
  next();
});

module.exports = mongoose.model('Discussion', DiscussionSchema);
