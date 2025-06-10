const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestoneTimeline,
  linkTasksToMilestone,
  getMilestoneAnalytics,
  getMilestoneDetails,
  updateMilestoneProgress,
  bulkUpdateMilestones,
  getMilestoneGanttData
} = require('../controllers/milestone.controller');
const { protect } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Milestone routes
router.route('/')
  .get(getProjectMilestones)
  .post(createMilestone);

// Analytics and bulk operations
router.get('/analytics', getMilestoneAnalytics);
router.put('/bulk-update', bulkUpdateMilestones);

router.route('/timeline')
  .get(getMilestoneTimeline);

router.get('/timeline/gantt', getMilestoneGanttData);

router.route('/:id')
  .put(updateMilestone)
  .delete(deleteMilestone);

router.get('/:id/details', getMilestoneDetails);
router.put('/:id/progress', updateMilestoneProgress);

router.route('/:id/tasks')
  .post(linkTasksToMilestone);

module.exports = router;
