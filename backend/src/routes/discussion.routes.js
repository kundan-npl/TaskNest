const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  togglePin
} = require('../controllers/discussion.controller');
const { protect } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Discussion routes
router.route('/')
  .get(getDiscussions)
  .post(createDiscussion);

router.route('/:id')
  .get(getDiscussion)
  .put(updateDiscussion)
  .delete(deleteDiscussion);

// Discussion actions
router.post('/:id/replies', addReply);
router.put('/:id/pin', togglePin);

module.exports = router;
