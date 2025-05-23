const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject 
} = require('../controllers/project.controller');
const { protect, authorize } = require('../middleware/auth/auth');

// Task routes
const taskRouter = require('./task.routes');
router.use('/:projectId/tasks', taskRouter);

// Apply protection to all routes
router.use(protect);

// Project routes
router.route('/')
  .get(getProjects)
  .post(authorize('admin', 'manager'), createProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('admin', 'manager'), updateProject)
  .delete(authorize('admin', 'manager'), deleteProject);

module.exports = router;
