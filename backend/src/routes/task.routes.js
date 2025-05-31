const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  uploadTaskAttachment,
  addComment,
  updateTaskProgress,
  assignTask
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Task routes
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Task-specific actions
router.post('/:id/comments', addComment);
router.put('/:id/progress', updateTaskProgress);
router.put('/:id/assign', assignTask);
router.post('/:id/upload', uploadTaskAttachment);

module.exports = router;
