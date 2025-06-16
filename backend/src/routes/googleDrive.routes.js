// backend/src/routes/googleDrive.routes.js
const router = require('express').Router();
const googleDriveController = require('../controllers/googleDrive.controller');
const { protect } = require('../middleware/auth/auth');

router.use(protect);

router.get('/projects/:projectId/drive/auth-url', googleDriveController.getAuthUrl);
router.get('/projects/:projectId/drive/oauth-callback', googleDriveController.oauthCallback);
router.get('/projects/:projectId/drive/status', googleDriveController.getDriveStatus);
router.get('/projects/:projectId/drive/files', googleDriveController.listFiles);

module.exports = router;
