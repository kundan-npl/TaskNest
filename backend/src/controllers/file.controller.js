const fileService = require('../services/file.service');

/**
 * Controller for handling file upload and download operations
 */
const fileController = {
  /**
   * Generate a presigned URL for file upload
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Upload information including URL and file key
   */
  getUploadUrl: async (req, res) => {
    try {
      const { filename, contentType, projectId, taskId } = req.body;

      if (!filename || !contentType) {
        return res.status(400).json({
          success: false,
          error: 'Filename and content type are required'
        });
      }

      const uploadInfo = await fileService.getUploadUrl({
        filename,
        contentType,
        projectId,
        taskId
      });

      return res.status(200).json({
        success: true,
        data: uploadInfo
      });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate upload URL'
      });
    }
  },

  /**
   * Save file metadata after successful upload
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Saved file information
   */
  saveFileMetadata: async (req, res) => {
    try {
      const { fileKey, filename, contentType, size, projectId, taskId } = req.body;

      if (!fileKey || !filename) {
        return res.status(400).json({
          success: false,
          error: 'File key and filename are required'
        });
      }

      // Here you would typically save file metadata to your database
      // For now we'll just return the file information
      // In a real implementation, you would create a file model and save the data

      const fileInfo = {
        fileKey,
        filename,
        contentType,
        size,
        projectId,
        taskId,
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
        s3Url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`
      };

      return res.status(200).json({
        success: true,
        data: fileInfo
      });
    } catch (error) {
      console.error('Error saving file metadata:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save file metadata'
      });
    }
  },

  /**
   * Get download URL for a file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Download URL
   */
  getDownloadUrl: async (req, res) => {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'File key is required'
        });
      }

      const downloadUrl = await fileService.getDownloadUrl(fileKey);

      return res.status(200).json({
        success: true,
        data: {
          downloadUrl
        }
      });
    } catch (error) {
      console.error('Error generating download URL:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate download URL'
      });
    }
  },

  /**
   * Delete a file from S3
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Success status
   */
  deleteFile: async (req, res) => {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(400).json({
          success: false,
          error: 'File key is required'
        });
      }

      await fileService.deleteFile(fileKey);

      // Here you would typically also delete the file metadata from your database
      // In a real implementation, you would remove the file record from your database

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete file'
      });
    }
  },

  /**
   * List files for a specific context (project or task)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Array of file information
   */
  listFiles: async (req, res) => {
    try {
      const { projectId, taskId } = req.query;

      const files = await fileService.listFiles({
        projectId,
        taskId
      });

      return res.status(200).json({
        success: true,
        data: files
      });
    } catch (error) {
      console.error('Error listing files:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to list files'
      });
    }
  }
};

module.exports = fileController;
