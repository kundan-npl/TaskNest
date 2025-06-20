const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  getProjectAnalytics,
  updateProjectStatus,
  inviteMember,
  acceptInvitation,
  getPendingInvitations,
  cancelInvitation,
  getProjectActivity,
  getTeamStats,
  getProjectMembers
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth/auth');

// Public routes (no authentication required)
router.post('/accept-invitation/:token', acceptInvitation);

// Apply protection to all other routes
router.use(protect);

// Task routes
const taskRouter = require('./task.routes');
router.use('/:projectId/tasks', taskRouter);

// Discussion routes
const discussionRouter = require('./discussion.routes');
router.use('/:projectId/discussions', discussionRouter);

// Milestone routes
const milestoneRouter = require('./milestone.routes');
router.use('/:projectId/milestones', milestoneRouter);

// Communication routes
const communicationRouter = require('./communication.routes');
router.use('/:projectId/messages', communicationRouter);

// File routes - Disabled (Using Google Drive instead)
// const fileRouter = require('./file.routes');
// router.use('/:projectId/files', fileRouter);

// Notification routes for projects
const { 
  getProjectNotifications,
  updateProjectNotificationPreferences,
  getProjectNotificationPreferences,
  markProjectNotificationsAsRead,
  getProjectNotificationStats,
  createProjectNotification
} = require('../controllers/notification.controller');

router.get('/:projectId/notifications', getProjectNotifications);
router.post('/:projectId/notifications', createProjectNotification);
router.get('/:projectId/notifications/stats', getProjectNotificationStats);
router.get('/:projectId/notifications/preferences', getProjectNotificationPreferences);
router.put('/:projectId/notifications/preferences', updateProjectNotificationPreferences);
router.put('/:projectId/notifications/mark-read', markProjectNotificationsAsRead);

// Project routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

// Enhanced project routes for widgets
router.get('/:id/analytics', getProjectAnalytics);
router.get('/:id/team/stats', getTeamStats);
router.put('/:id/status', updateProjectStatus);
router.get('/:id/activity', getProjectActivity);

// Member management routes
router.get('/:id/members', getProjectMembers);
router.post('/:id/members', addMember);
router.post('/:id/invite', inviteMember);
router.put('/:id/members/:memberId/role', updateMemberRole);
router.delete('/:id/members/:memberId', removeMember);

// Invitation management routes
router.get('/:id/pending-invitations', getPendingInvitations);
router.delete('/:id/invitations/:invitationId', cancelInvitation);

module.exports = router;
