const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  uploadTaskAttachment
} = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Task routes
router.route('/')
  .get(getTasks)
  .post(authorize('admin', 'manager'), createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)  // All authenticated users can update tasks
  .delete(authorize('admin', 'manager'), deleteTask);

// Task attachment route
router.route('/:id/upload')
  .post(protect, uploadTaskAttachment);

module.exports = router;
