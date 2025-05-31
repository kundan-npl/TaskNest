const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotificationCounts,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications
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

module.exports = router;
