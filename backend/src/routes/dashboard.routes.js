const express = require('express');
const {
  getDashboardStats,
  getUserDashboard,
  getDashboardUpdates,
  getActivityFeed,
  getPerformanceMetrics,
  getSystemHealth
} = require('../controllers/dashboard.controller');

const { protect } = require('../middleware/auth/auth');

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(protect);

// Dashboard statistics
router.get('/stats', getDashboardStats);

// User-specific dashboard
router.get('/user/:userId', getUserDashboard);

// Real-time updates
router.get('/updates', getDashboardUpdates);

// Activity feed
router.get('/activity', getActivityFeed);

// Performance metrics
router.get('/metrics', getPerformanceMetrics);

// System health (admin only)
router.get('/system-health', getSystemHealth);

module.exports = router;
