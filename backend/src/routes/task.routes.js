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
  assignTask,
  bulkUpdateTasks,
  bulkDeleteTasks,
  bulkAssignTasks,
  moveTasksToStatus,
  getTaskAnalytics,
  searchTasks,
  getTaskByIdSimple,
  getTaskComments
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Task routes
router.route('/')
  .get(getTasks)
  .post(createTask);

// Bulk operations
router.put('/bulk-update', bulkUpdateTasks);
router.delete('/bulk-delete', bulkDeleteTasks);
router.put('/bulk-assign', bulkAssignTasks);
router.put('/move-status', moveTasksToStatus);

// Task analytics and search
router.get('/analytics', getTaskAnalytics);
router.get('/search', searchTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Task-specific actions
router.post('/:id/comments', addComment);
router.put('/:id/progress', updateTaskProgress);
router.put('/:id/assign', assignTask);
router.post('/:id/upload', uploadTaskAttachment);
router.get('/:id/comments', getTaskComments);

// Add a simple route for /api/v1/tasks/:id/simple that returns a task by id only, with all fields mapped for the frontend.
router.get('/:id/simple', getTaskByIdSimple);

module.exports = router;
