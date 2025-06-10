const router = require('express').Router();
const {
  getUploadUrl,
  saveFileMetadata,
  getDownloadUrl,
  deleteFile,
  listFiles,
  createFolder,
  getFileVersions,
  addFileComment,
  shareFile,
  bulkDeleteFiles,
  getFileAnalytics,
  searchFiles
} = require('../controllers/file.controller');
const { protect } = require('../middleware/auth/auth');

// All routes are protected by authentication
router.use(protect);

// Analytics and search
router.get('/analytics', getFileAnalytics);
router.get('/search', searchFiles);

// Folder operations
router.post('/folders', createFolder);

// Bulk operations
router.delete('/bulk', bulkDeleteFiles);

// Get presigned URL for file upload
router.post('/upload-url', getUploadUrl);

// Save file metadata after successful upload
router.post('/metadata', saveFileMetadata);

// List files for a specific context (project or task)
router.get('/', listFiles);

// File-specific operations
router.get('/:fileId/versions', getFileVersions);
router.post('/:fileId/comments', addFileComment);
router.post('/:fileId/share', shareFile);

// Get download URL for a file
router.get('/download/:fileKey', getDownloadUrl);

// Delete a file
router.delete('/:fileKey', deleteFile);

module.exports = router;
