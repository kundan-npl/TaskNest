import { api } from './authService';

const fileService = {
  /**
   * Get a presigned URL for uploading a file to S3
   * @param {Object} fileData - File data
   * @param {string} fileData.filename - Original filename
   * @param {string} fileData.contentType - File MIME type
   * @param {string} fileData.projectId - Optional project ID
   * @param {string} fileData.taskId - Optional task ID
   * @returns {Promise<Object>} - Upload information including URL
   */
  getUploadUrl: async (fileData) => {
    try {
      const response = await api.post('/files/upload-url', fileData);
      return response.data.data;
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw new Error(error.response?.data?.error || 'Failed to generate upload URL');
    }
  },

  /**
   * Upload a file to S3 using a presigned URL with retry logic
   * @param {string} url - Presigned URL
   * @param {File} file - File object
   * @param {function} onProgress - Progress callback function
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<boolean>} - Upload success
   */
  uploadFileWithSignedUrl: async (url, file, onProgress = () => {}, maxRetries = 3) => {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        const xhr = new XMLHttpRequest();
        
        const uploadPromise = new Promise((resolve, reject) => {
          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', file.type);
          
          // Setup progress tracking
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              onProgress(percentComplete);
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(true);
            } else {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            reject(new Error('Network error occurred during upload'));
          };
          
          xhr.ontimeout = () => {
            reject(new Error('Upload timed out'));
          };
          
          // Set timeout to 30 seconds
          xhr.timeout = 30000;
          
          // Start upload
          xhr.send(file);
        });
        
        await uploadPromise;
        return true;
      } catch (error) {
        console.error(`Upload attempt ${retries + 1} failed:`, error);
        retries++;
        
        if (retries > maxRetries) {
          throw new Error(`Failed to upload file after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retries), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Reset progress before retry
        onProgress(0);
      }
    }
  },

  /**
   * Save file metadata after successful upload
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} - Saved file information
   */
  saveFileMetadata: async (metadata) => {
    try {
      const response = await api.post('/files/metadata', metadata);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to save file metadata');
    }
  },

  /**
   * Get a download URL for a file
   * @param {string} fileKey - S3 file key
   * @returns {Promise<string>} - Download URL
   */
  getDownloadUrl: async (fileKey) => {
    try {
      const response = await api.get(`/files/download/${fileKey}`);
      return response.data.data.downloadUrl;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get download URL');
    }
  },

  /**
   * Delete a file
   * @param {string} fileKey - S3 file key
   * @returns {Promise<boolean>} - Success status
   */
  deleteFile: async (fileKey) => {
    try {
      await api.delete(`/files/${fileKey}`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete file');
    }
  },

  /**
   * List files for a specific context (project or task)
   * @param {Object} options - Options
   * @param {string} options.projectId - Optional project ID
   * @param {string} options.taskId - Optional task ID
   * @returns {Promise<Array>} - Array of file information
   */
  listFiles: async (options = {}) => {
    try {
      let queryParams = '';
      
      if (options.projectId) {
        queryParams += `projectId=${options.projectId}`;
      }
      
      if (options.taskId) {
        queryParams += queryParams ? `&taskId=${options.taskId}` : `taskId=${options.taskId}`;
      }
      
      const url = queryParams ? `/files?${queryParams}` : '/files';
      const response = await api.get(url);
      
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to list files');
    }
  },

  // Enhanced File Management Methods
  
  /**
   * Get project files with advanced filtering
   * @param {string} projectId - Project ID
   * @param {Object} options - Filtering options
   * @param {string} options.folder - Folder path
   * @param {string} options.fileType - File type (extension)
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @param {number} options.page - Page number
   * @param {number} options.limit - Number of files per page
   * @returns {Promise<Array>} - List of project files
   */
  getProjectFiles: async (projectId, options = {}) => {
    try {
      const {
        folder = '',
        fileType = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 50
      } = options;
      
      const params = new URLSearchParams({
        folder,
        fileType,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString()
      }).toString();
      
      const response = await api.get(`/projects/${projectId}/files?${params}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch project files');
    }
  },

  /**
   * Create a folder in the project
   * @param {string} projectId - Project ID
   * @param {Object} folderData - Folder data
   * @param {string} folderData.name - Folder name
   * @param {string} [folderData.parentId] - Parent folder ID (for subfolders)
   * @returns {Promise<Object>} - Created folder information
   */
  createFolder: async (projectId, folderData) => {
    try {
      const response = await api.post(`/projects/${projectId}/folders`, folderData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create folder');
    }
  },

  /**
   * Delete a folder in the project
   * @param {string} projectId - Project ID
   * @param {string} folderId - Folder ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteFolder: async (projectId, folderId) => {
    try {
      const response = await api.delete(`/projects/${projectId}/folders/${folderId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete folder');
    }
  },

  /**
   * Move a file to a different folder
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @param {string} folderId - Target folder ID
   * @returns {Promise<Object>} - Updated file information
   */
  moveFile: async (projectId, fileId, folderId) => {
    try {
      const response = await api.put(`/projects/${projectId}/files/${fileId}/move`, { folderId });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to move file');
    }
  },

  /**
   * Rename a file
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @param {string} newName - New file name
   * @returns {Promise<Object>} - Updated file information
   */
  renameFile: async (projectId, fileId, newName) => {
    try {
      const response = await api.put(`/projects/${projectId}/files/${fileId}/rename`, { name: newName });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to rename file');
    }
  },

  /**
   * Get file download URL
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @returns {Promise<string>} - Download URL
   */
  getDownloadUrl: async (projectId, fileId) => {
    try {
      const response = await api.get(`/projects/${projectId}/files/${fileId}/download-url`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get download URL');
    }
  },

  /**
   * Get file preview URL (for images, PDFs, etc.)
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @returns {Promise<string>} - Preview URL
   */
  getPreviewUrl: async (projectId, fileId) => {
    try {
      const response = await api.get(`/projects/${projectId}/files/${fileId}/preview-url`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get preview URL');
    }
  },

  /**
   * Share a file with specific users or groups
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @param {Object} shareData - Sharing information
   * @param {Array<string>} shareData.userIds - List of user IDs to share with
   * @param {Array<string>} shareData.groupIds - List of group IDs to share with
   * @returns {Promise<Object>} - Sharing status
   */
  shareFile: async (projectId, fileId, shareData) => {
    try {
      const response = await api.post(`/projects/${projectId}/files/${fileId}/share`, shareData);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to share file');
    }
  },

  /**
   * Add a comment to a file
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @param {string} comment - Comment content
   * @returns {Promise<Object>} - Added comment information
   */
  addFileComment: async (projectId, fileId, comment) => {
    try {
      const response = await api.post(`/projects/${projectId}/files/${fileId}/comments`, { content: comment });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add file comment');
    }
  },

  /**
   * Get comments for a file
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @returns {Promise<Array>} - List of comments
   */
  getFileComments: async (projectId, fileId) => {
    try {
      const response = await api.get(`/projects/${projectId}/files/${fileId}/comments`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch file comments');
    }
  },

  /**
   * Get versions of a file
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @returns {Promise<Array>} - List of file versions
   */
  getFileVersions: async (projectId, fileId) => {
    try {
      const response = await api.get(`/projects/${projectId}/files/${fileId}/versions`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch file versions');
    }
  },

  /**
   * Upload a new version of a file
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @param {File} file - File object
   * @param {function} onProgress - Progress callback function
   * @returns {Promise<Object>} - Uploaded file version information
   */
  uploadFileVersion: async (projectId, fileId, file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/projects/${projectId}/files/${fileId}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.lengthComputable) {
            const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress(percentComplete);
          }
        }
      });
      
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to upload file version');
    }
  },

  /**
   * Delete multiple files at once
   * @param {string} projectId - Project ID
   * @param {Array<string>} fileIds - List of file IDs to delete
   * @returns {Promise<boolean>} - Success status
   */
  bulkDeleteFiles: async (projectId, fileIds) => {
    try {
      const response = await api.delete(`/projects/${projectId}/files/bulk`, { data: { fileIds } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to bulk delete files');
    }
  },

  /**
   * Move multiple files to a different folder
   * @param {string} projectId - Project ID
   * @param {Array<string>} fileIds - List of file IDs to move
   * @param {string} folderId - Target folder ID
   * @returns {Promise<Array>} - List of updated file information
   */
  bulkMoveFiles: async (projectId, fileIds, folderId) => {
    try {
      const response = await api.put(`/projects/${projectId}/files/bulk-move`, { fileIds, folderId });
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to bulk move files');
    }
  },

  /**
   * Search for files in a project
   * @param {string} projectId - Project ID
   * @param {string} searchTerm - Search term (filename or content)
   * @returns {Promise<Array>} - List of matching files
   */
  searchFiles: async (projectId, searchTerm) => {
    try {
      const response = await api.get(`/projects/${projectId}/files/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to search files');
    }
  },

  /**
   * Get storage usage information for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} - Storage usage data
   */
  getStorageUsage: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/files/storage-usage`);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch storage usage');
    }
  },

  // File utilities
  getFileTypeIcon: (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
      pdf: '📄',
      doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      ppt: '📊', pptx: '📊',
      txt: '📄',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
      mp4: '🎥', avi: '🎥', mov: '🎥',
      mp3: '🎵', wav: '🎵',
      zip: '📦', rar: '📦',
      default: '📄'
    };
    return iconMap[extension] || iconMap.default;
  },

  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  isImageFile: (fileName) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension);
  },

  isVideoFile: (fileName) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return videoExtensions.includes(extension);
  }
};

export default fileService;
