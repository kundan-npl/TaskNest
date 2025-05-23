const { v4: uuidv4 } = require('uuid');
const path = require('path');
const s3Config = require('../config/s3');

/**
 * Service for handling file uploads and downloads using AWS S3
 */
const fileService = {
  /**
   * Generate a unique file key for S3
   * @param {string} originalFilename - Original filename
   * @param {string} prefix - Optional folder prefix
   * @returns {string} - Unique file key
   */
  generateUniqueFileKey: (originalFilename, prefix = '') => {
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const extension = path.extname(originalFilename);
    const sanitizedFilename = path.basename(originalFilename, extension)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    
    if (prefix) {
      return `${prefix}/${timestamp}-${sanitizedFilename}-${uniqueId}${extension}`;
    }
    
    return `${timestamp}-${sanitizedFilename}-${uniqueId}${extension}`;
  },

  /**
   * Create a presigned URL for file upload based on project and task context
   * @param {Object} options - Upload options
   * @param {string} options.filename - Original filename
   * @param {string} options.contentType - File content type
   * @param {string} options.projectId - Optional project ID
   * @param {string} options.taskId - Optional task ID
   * @returns {Promise<Object>} - Upload information including URL and file key
   */
  getUploadUrl: async ({ filename, contentType, projectId, taskId }) => {
    let prefix = 'uploads';
    
    // Organize files by project and task if provided
    if (projectId) {
      prefix = `projects/${projectId}`;
      
      if (taskId) {
        prefix = `projects/${projectId}/tasks/${taskId}`;
      }
    }
    
    const fileKey = fileService.generateUniqueFileKey(filename, prefix);
    
    try {
      const uploadUrl = await s3Config.generateUploadUrl(fileKey, contentType);
      
      return {
        uploadUrl,
        fileKey,
        filename,
        contentType,
        expiresIn: 60, // URL expires in 60 seconds
        s3Url: `https://${s3Config.bucketName}.s3.amazonaws.com/${fileKey}`
      };
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  },

  /**
   * Get download URL for a file
   * @param {string} fileKey - S3 file key
   * @returns {Promise<string>} - Download URL
   */
  getDownloadUrl: async (fileKey) => {
    try {
      const downloadUrl = await s3Config.generateDownloadUrl(fileKey);
      return downloadUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  },

  /**
   * Delete a file from S3
   * @param {string} fileKey - S3 file key
   * @returns {Promise<boolean>} - Success status
   */
  deleteFile: async (fileKey) => {
    try {
      await s3Config.deleteFile(fileKey);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  },

  /**
   * List files for a specific context (project or task)
   * @param {Object} options - Options
   * @param {string} options.projectId - Optional project ID
   * @param {string} options.taskId - Optional task ID
   * @returns {Promise<Array>} - Array of file information
   */
  listFiles: async ({ projectId, taskId }) => {
    let prefix = 'uploads';
    
    if (projectId) {
      prefix = `projects/${projectId}`;
      
      if (taskId) {
        prefix = `projects/${projectId}/tasks/${taskId}`;
      }
    }
    
    try {
      const files = await s3Config.listFiles(prefix);
      
      // Get download URLs for each file
      const filesWithUrls = await Promise.all(
        files.map(async (file) => {
          const downloadUrl = await s3Config.generateDownloadUrl(file.key);
          const filename = path.basename(file.key);
          
          return {
            ...file,
            filename,
            downloadUrl,
            s3Url: `https://${s3Config.bucketName}.s3.amazonaws.com/${file.key}`
          };
        })
      );
      
      return filesWithUrls;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }
};

module.exports = fileService;
