const Discussion = require('../models/discussion.model');
const Project = require('../models/project.model');

// Helper function to check user's project role
const getUserProjectRole = (project, userId) => {
  return project.members.find(member => 
    member.user.toString() === userId.toString()
  );
};

/**
 * @desc    Get all discussions for a project
 * @route   GET /api/v1/projects/:projectId/discussions
 * @access  Private (Project Members)
 */
exports.getDiscussions = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check if user has access to the project
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
        error: 'Access denied. You are not a member of this project.'
      });
    }

    const discussions = await Discussion.find({ project: projectId })
      .populate('author', 'name email department jobTitle')
      .populate('replies.author', 'name email department jobTitle')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: discussions.length,
      data: discussions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single discussion
 * @route   GET /api/v1/projects/:projectId/discussions/:id
 * @access  Private (Project Members)
 */
exports.getDiscussion = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    // Check if user has access to the project
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
        error: 'Access denied. You are not a member of this project.'
      });
    }

    const discussion = await Discussion.findOne({ _id: id, project: projectId })
      .populate('author', 'name email department jobTitle')
      .populate('replies.author', 'name email department jobTitle');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found'
      });
    }

    res.status(200).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new discussion
 * @route   POST /api/v1/projects/:projectId/discussions
 * @access  Private (Project Members)
 */
exports.createDiscussion = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, content, category } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    // Check if user has access to the project
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
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Create discussion
    const discussion = await Discussion.create({
      title,
      content,
      category: category || 'general',
      author: req.user.id,
      project: projectId
    });

    await discussion.populate('author', 'name email department jobTitle');

    res.status(201).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update discussion
 * @route   PUT /api/v1/projects/:projectId/discussions/:id
 * @access  Private (Author or Project Supervisor)
 */
exports.updateDiscussion = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const { title, content, category } = req.body;

    const discussion = await Discussion.findOne({ _id: id, project: projectId });
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Check if user can update (author or supervisor/team-lead with update permissions)
    const canUpdate = discussion.author.toString() === req.user.id || 
                     userMember.permissions.update;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own discussions or need update permissions.'
      });
    }

    // Update fields if provided
    if (title) discussion.title = title;
    if (content) discussion.content = content;
    if (category) discussion.category = category;

    await discussion.save();
    await discussion.populate('author', 'name email department jobTitle');

    res.status(200).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete discussion
 * @route   DELETE /api/v1/projects/:projectId/discussions/:id
 * @access  Private (Author or Project Supervisor)
 */
exports.deleteDiscussion = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    const discussion = await Discussion.findOne({ _id: id, project: projectId });
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Check if user can delete (author or supervisor/team-lead with delete permissions)
    const canDelete = discussion.author.toString() === req.user.id || 
                     userMember.permissions.delete;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own discussions or need delete permissions.'
      });
    }

    await Discussion.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add reply to discussion
 * @route   POST /api/v1/projects/:projectId/discussions/:id/replies
 * @access  Private (Project Members)
 */
exports.addReply = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Reply content is required'
      });
    }

    const discussion = await Discussion.findOne({ _id: id, project: projectId });
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this project.'
      });
    }

    // Add reply
    discussion.replies.push({
      content: content.trim(),
      author: req.user.id,
      createdAt: new Date()
    });

    await discussion.save();
    await discussion.populate('replies.author', 'name email department jobTitle');

    res.status(201).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pin/Unpin discussion
 * @route   PUT /api/v1/projects/:projectId/discussions/:id/pin
 * @access  Private (Project Supervisor/Team Lead)
 */
exports.togglePin = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    const discussion = await Discussion.findOne({ _id: id, project: projectId });
    if (!discussion) {
      return res.status(404).json({
        success: false,
        error: 'Discussion not found'
      });
    }

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    const userMember = getUserProjectRole(project, req.user.id);
    
    if (!userMember || !userMember.permissions.manage_settings) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You need management permissions to pin discussions.'
      });
    }

    // Toggle pin status
    discussion.isPinned = !discussion.isPinned;
    await discussion.save();

    res.status(200).json({
      success: true,
      data: discussion
    });
  } catch (error) {
    next(error);
  }
};
