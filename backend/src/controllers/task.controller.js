const Task = require('../models/task.model');
const Project = require('../models/project.model');

/**
 * @desc    Get all tasks for a project
 * @route   GET /api/v1/projects/:projectId/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user has access to the project
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access tasks for this project'
      });
    }
    
    // Get tasks
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'name email');
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/v1/projects/:projectId/tasks/:id
 * @access  Private
 */
exports.getTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    
    const task = await Task.findOne({ _id: id, project: projectId })
      .populate('assignee', 'name email');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to the project
    const project = await Project.findById(projectId);
    
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this task'
      });
    }
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create task
 * @route   POST /api/v1/projects/:projectId/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // Check if project exists
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user has access to create tasks
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create tasks for this project'
      });
    }
    
    // Add project and user to request body
    req.body.project = projectId;
    req.body.createdBy = req.user.id;
    
    const task = await Task.create(req.body);
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/v1/projects/:projectId/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    
    let task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to update the task
    const project = await Project.findById(projectId);
    
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && 
        task.createdBy.toString() !== req.user.id && 
        !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this task'
      });
    }
    
    task = await Task.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/v1/projects/:projectId/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    
    const task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to delete the task
    const project = await Project.findById(projectId);
    
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && 
        task.createdBy.toString() !== req.user.id && 
        !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this task'
      });
    }
    
    await Task.deleteOne({ _id: id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload task attachment
 * @route   POST /api/v1/projects/:projectId/tasks/:id/upload
 * @access  Private
 */
exports.uploadTaskAttachment = async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    
    const task = await Task.findOne({ _id: id, project: projectId });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to the task
    const project = await Project.findById(projectId);
    
    const isTeamMember = project.team.some(memberId => 
      memberId.toString() === req.user.id
    );
    
    if (project.createdBy.toString() !== req.user.id && !isTeamMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to upload attachments to this task'
      });
    }
    
    // File upload handled by separate file controller and S3 service
    // This is just a placeholder route for API documentation
    
    res.status(200).json({
      success: true,
      data: {
        message: 'File upload processing handled by file controller'
      }
    });
  } catch (error) {
    next(error);
  }
};
