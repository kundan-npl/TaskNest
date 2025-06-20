// backend/src/routes/googleDrive.routes.js
const router = require('express').Router();
const multer = require('multer');
const googleDriveController = require('../controllers/googleDrive.controller');
const { protect } = require('../middleware/auth/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types
    const allowedMimes = [
      'image/', 'application/', 'text/', 'video/', 'audio/',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.',
      'application/vnd.ms-excel', 'application/vnd.ms-powerpoint'
    ];
    
    const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime));
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// OAuth callback route - NOT PROTECTED (Google calls this directly)
router.get('/drive/oauth-callback', googleDriveController.oauthCallback);

// All other routes require authentication
router.use(protect);

router.get('/projects/:projectId/drive/auth-url', googleDriveController.getAuthUrl);
router.get('/projects/:projectId/drive/status', googleDriveController.getDriveStatus);
router.get('/projects/:projectId/drive/files', googleDriveController.listFiles);
router.post('/projects/:projectId/drive/upload', upload.single('file'), googleDriveController.uploadFile);
router.delete('/projects/:projectId/drive/files/:fileId', googleDriveController.deleteFile);
router.get('/projects/:projectId/drive/files/:fileId/download', googleDriveController.downloadFile);

module.exports = router;
