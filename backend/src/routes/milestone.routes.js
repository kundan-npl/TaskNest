const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getMilestoneTimeline,
  linkTasksToMilestone
} = require('../controllers/milestone.controller');
const { protect } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Milestone routes
router.route('/')
  .get(getProjectMilestones)
  .post(createMilestone);

router.route('/timeline')
  .get(getMilestoneTimeline);

router.route('/:id')
  .put(updateMilestone)
  .delete(deleteMilestone);

router.route('/:id/tasks')
  .post(linkTasksToMilestone);

module.exports = router;
