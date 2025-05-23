const Project = require('../models/project.model');

/**
 * @desc    Get all projects
 * @route   GET /api/v1/projects
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
  try {
    // Get projects created by user or where user is a team member
    const query = {
      $or: [
        { createdBy: req.user.id },
        { team: req.user.id }
      ]
    };
    
    const projects = await Project.find(query).populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('team', 'name email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access to the project
    const isTeamMember = project.team.some(member => 
      member._id.toString() === req.user.id
    );
    
    if (project.createdBy._id.toString() !== req.user.id && !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this project'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create project
 * @route   POST /api/v1/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
  try {
    // Add user as the creator of the project
    req.body.createdBy = req.user.id;
    
    const project = await Project.create(req.body);
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/v1/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user is project creator
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this project'
      });
    }
    
    project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user is project creator
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this project'
      });
    }
    
    await Project.deleteOne({ _id: req.params.id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
