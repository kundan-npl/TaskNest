const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Task routes
const taskRouter = require('./task.routes');
router.use('/:projectId/tasks', taskRouter);

// Discussion routes
const discussionRouter = require('./discussion.routes');
router.use('/:projectId/discussions', discussionRouter);

// Project routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Member management routes
router.post('/:id/members', addMember);
router.put('/:id/members/:memberId', updateMemberRole);
router.delete('/:id/members/:memberId', removeMember);

module.exports = router;
