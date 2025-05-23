const router = require('express').Router();
const fileController = require('../controllers/file.controller');
const { protect } = require('../middleware/auth/auth');

// All routes are protected by authentication
router.use(protect);

// Get presigned URL for file upload
router.post('/upload-url', fileController.getUploadUrl);

// Save file metadata after successful upload
router.post('/metadata', fileController.saveFileMetadata);

// Get download URL for a file
router.get('/download/:fileKey', fileController.getDownloadUrl);

// Delete a file
router.delete('/:fileKey', fileController.deleteFile);

// List files for a specific context (project or task)
router.get('/', fileController.listFiles);

module.exports = router;
