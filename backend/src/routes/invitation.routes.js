const express = require('express');
const router = express.Router();
const {
  sendInvitation,
  validateInvitation,  
  respondToInvitation,
  cancelInvitation,
  getProjectInvitations
} = require('../controllers/invitation.controller');
const { protect } = require('../middleware/auth/auth');

// Public routes
router.get('/validate/:token', validateInvitation);

// Protected routes
router.use(protect);
router.post('/send', sendInvitation);
router.post('/respond', respondToInvitation);
router.delete('/cancel/:token', cancelInvitation);
router.get('/project/:projectId', getProjectInvitations);

module.exports = router;
