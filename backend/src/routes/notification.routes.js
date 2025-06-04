const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotificationCounts,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getProjectNotifications,
  updateProjectNotificationPreferences,
  getProjectNotificationPreferences,
  markProjectNotificationsAsRead,
  getProjectNotificationStats,
  createProjectNotification
} = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Notification routes
router.get('/', getNotifications);
router.get('/counts', getNotificationCounts);
router.put('/read-all', markAllAsRead);
router.delete('/read', deleteReadNotifications);

router.route('/:id')
  .put(markAsRead)
  .delete(deleteNotification);

// Specific action route
router.put('/:id/read', markAsRead);

// Project-specific notification routes (to be used as nested routes)
router.get('/project/:projectId', getProjectNotifications);
router.post('/project/:projectId', createProjectNotification);
router.get('/project/:projectId/stats', getProjectNotificationStats);
router.get('/project/:projectId/preferences', getProjectNotificationPreferences);
router.put('/project/:projectId/preferences', updateProjectNotificationPreferences);
router.put('/project/:projectId/mark-read', markProjectNotificationsAsRead);

module.exports = router;
