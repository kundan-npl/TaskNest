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
      // Get projectId from route params when called from nested route
      const { projectId: routeProjectId } = req.params;
      const { projectId: queryProjectId, taskId } = req.query;
      
      // Use route param if available, otherwise use query param
      const projectId = routeProjectId || queryProjectId;

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
  },

  /**
   * @desc    Create a new folder
   * @route   POST /api/v1/projects/:projectId/files/folders
   * @access  Private
   */
  createFolder: async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { name, parentId = null } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Folder name is required'
        });
      }

      // Verify project access
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const userMember = project.members.find(member => {
        const memberUserId = member.user._id || member.user;
        return memberUserId.toString() === req.user.id;
      });

      if (!userMember) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this project'
        });
      }

      const folderData = {
        name: name.trim(),
        type: 'folder',
        projectId,
        parentId,
        createdBy: req.user.id,
        size: 0,
        path: parentId ? `${parentId}/${name.trim()}` : name.trim()
      };

      const folder = await fileService.createFolder(folderData);

      // Emit real-time update
      const socketService = require('../services/socketService');
      socketService.emitToProject(projectId, 'file:folder_created', {
        folder,
        createdBy: req.user.name,
        timestamp: new Date()
      });

      res.status(201).json({
        success: true,
        data: folder
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    Get file versions
   * @route   GET /api/v1/projects/:projectId/files/:fileId/versions
   * @access  Private
   */
  getFileVersions: async (req, res, next) => {
    try {
      const { projectId, fileId } = req.params;

      // Verify project access
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const userMember = project.members.find(member => {
        const memberUserId = member.user._id || member.user;
        return memberUserId.toString() === req.user.id;
      });

      if (!userMember) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this project'
        });
      }

      const versions = await fileService.getFileVersions(fileId);

      res.json({
        success: true,
        data: versions
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    Add comment to file
   * @route   POST /api/v1/projects/:projectId/files/:fileId/comments
   * @access  Private
   */
  addFileComment: async (req, res, next) => {
    try {
      const { projectId, fileId } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Comment content is required'
        });
      }

      // Verify project access
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const userMember = project.members.find(member => {
        const memberUserId = member.user._id || member.user;
        return memberUserId.toString() === req.user.id;
      });

      if (!userMember) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this project'
        });
      }

      const commentData = {
        content: content.trim(),
        author: req.user.id,
        fileId,
        createdAt: new Date()
      };

      const comment = await fileService.addFileComment(commentData);

      // Emit real-time update
      const socketService = require('../services/socketService');
      socketService.emitToProject(projectId, 'file:comment_added', {
        fileId,
        comment,
        author: req.user.name,
        timestamp: new Date()
      });

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    Share file with specific permissions
   * @route   POST /api/v1/projects/:projectId/files/:fileId/share
   * @access  Private
   */
  shareFile: async (req, res, next) => {
    try {
      const { projectId, fileId } = req.params;
      const { users, permissions = 'view', expiresAt } = req.body;

      // Verify project access and permissions
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const userMember = project.members.find(member => {
        const memberUserId = member.user._id || member.user;
        return memberUserId.toString() === req.user.id;
      });

      if (!userMember || (!userMember.permissions?.canManageFiles && userMember.role === 'teamMember')) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to share files'
        });
      }

      const shareData = {
        fileId,
        sharedBy: req.user.id,
        users,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        sharedAt: new Date()
      };

      const shareInfo = await fileService.shareFile(shareData);

      // Create notifications for shared users
      if (users && users.length > 0) {
        const Notification = require('../models/notification.model');
        const notifications = [];
        
        for (const userId of users) {
          notifications.push({
            title: 'File Shared',
            message: `${req.user.name} shared a file with you in project "${project.title}"`,
            type: 'system_announcement', // Using existing enum value
            recipient: userId,
            sender: req.user.id,
            relatedProject: projectId,
            actionUrl: `/projects/${projectId}/files`,
            metadata: { 
              fileId: fileId,
              permissions: permissions 
            }
          });
        }
        
        await Notification.insertMany(notifications);
      }

      // Emit real-time update
      const socketService = require('../services/socketService');
      socketService.emitToProject(projectId, 'file:shared', {
        fileId,
        shareInfo,
        sharedBy: req.user.name,
        timestamp: new Date()
      });

      res.status(201).json({
        success: true,
        data: shareInfo
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    Bulk delete files
   * @route   DELETE /api/v1/projects/:projectId/files/bulk
   * @access  Private
   */
  bulkDeleteFiles: async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { fileIds } = req.body;

      if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'File IDs array is required'
        });
      }

      // Verify project access and permissions
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const userMember = project.members.find(member => {
        const memberUserId = member.user._id || member.user;
        return memberUserId.toString() === req.user.id;
      });

      if (!userMember || (!userMember.permissions?.canManageFiles && userMember.role === 'teamMember')) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete files'
        });
      }

      const result = await fileService.bulkDeleteFiles(fileIds);

      // Emit real-time update
      const socketService = require('../services/socketService');
      socketService.emitToProject(projectId, 'files:bulk_deleted', {
        fileIds,
        deletedCount: result.deletedCount,
        deletedBy: req.user.name,
        timestamp: new Date()
      });

      res.json({
        success: true,
        data: {
          deletedCount: result.deletedCount,
          message: `${result.deletedCount} files deleted successfully`
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    Get file analytics
   * @route   GET /api/v1/projects/:projectId/files/analytics
   * @access  Private
   */
  getFileAnalytics: async (req, res, next) => {
    try {
      const { projectId } = req.params;

      // Verify project access
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const userMember = project.members.find(member => {
        const memberUserId = member.user._id || member.user;
        return memberUserId.toString() === req.user.id;
      });

      if (!userMember) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this project'
        });
      }

      const analytics = await fileService.getProjectFileAnalytics(projectId);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @desc    Search files
   * @route   GET /api/v1/projects/:projectId/files/search
   * @access  Private
   */
  searchFiles: async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { q, type, size, dateRange } = req.query;

      if (!q || !q.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      // Verify project access
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const userMember = project.members.find(member => {
        const memberUserId = member.user._id || member.user;
        return memberUserId.toString() === req.user.id;
      });

      if (!userMember) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this project'
        });
      }

      const searchOptions = {
        projectId,
        query: q.trim(),
        type,
        size,
        dateRange: dateRange ? JSON.parse(dateRange) : null
      };

      const results = await fileService.searchFiles(searchOptions);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = {
  ...fileController,
  createFolder: fileController.createFolder,
  getFileVersions: fileController.getFileVersions,
  addFileComment: fileController.addFileComment,
  shareFile: fileController.shareFile,
  bulkDeleteFiles: fileController.bulkDeleteFiles,
  getFileAnalytics: fileController.getFileAnalytics,
  searchFiles: fileController.searchFiles
};
