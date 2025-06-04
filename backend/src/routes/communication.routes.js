const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProjectDiscussions,
  createDiscussion,
  getProjectMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addMessageReaction,
  getProjectActivity,
  updateTypingStatus
} = require('../controllers/communication.controller');
const { protect } = require('../middleware/auth/auth');

// Apply protection to all routes
router.use(protect);

// Message routes
router.route('/')
  .get(getProjectMessages)
  .post(sendMessage);

router.route('/:messageId')
  .put(editMessage)
  .delete(deleteMessage);

router.route('/:messageId/reactions')
  .post(addMessageReaction);

// Discussion routes (nested under messages for communication widget)
router.route('/discussions')
  .get(getProjectDiscussions)
  .post(createDiscussion);

// Activity and typing status
router.route('/activity')
  .get(getProjectActivity);

router.route('/typing')
  .post(updateTypingStatus);

module.exports = router;
