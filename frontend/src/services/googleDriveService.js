import { api } from './authService';

const googleDriveService = {
  /**
   * Check if Google Drive is connected for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<boolean>} - Connection status
   */
  getConnectionStatus: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/drive/status`);
      return response.data.connected;
    } catch (error) {
      console.error('Error checking Drive status:', error);
      return false;
    }
  },

  /**
   * Get authorization URL for Google Drive
   * @param {string} projectId - Project ID
   * @returns {Promise<string>} - Authorization URL
   */
  getAuthUrl: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/drive/auth-url`);
      return response.data.url;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get authorization URL');
    }
  },

  /**
   * List files in Google Drive for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of files
   */
  listFiles: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/drive/files`);
      return response.data.files || [];
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch files from Google Drive');
    }
  },

  /**
   * Upload a file to Google Drive
   * @param {string} projectId - Project ID
   * @param {File} file - File to upload
   * @param {function} onProgress - Progress callback
   * @returns {Promise<Object>} - Upload result
   */
  uploadFile: async (projectId, file, onProgress = () => {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/projects/${projectId}/drive/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress(percentComplete);
          }
        }
      });

      return response.data.file;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to upload file to Google Drive');
    }
  },

  /**
   * Delete a file from Google Drive
   * @param {string} projectId - Project ID
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteFile: async (projectId, fileId) => {
    try {
      await api.delete(`/projects/${projectId}/drive/files/${fileId}`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete file from Google Drive');
    }
  },

  /**
   * Get download URL for a file
   * @param {string} projectId - Project ID
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<Object>} - Download information
   */
  getDownloadUrl: async (projectId, fileId) => {
    try {
      const response = await api.get(`/projects/${projectId}/drive/files/${fileId}/download`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get download URL');
    }
  },

  /**
   * Get file type icon based on MIME type
   * @param {string} mimeType - File MIME type
   * @returns {string} - Icon/emoji for file type
   */
  getFileIcon: (mimeType) => {
    if (!mimeType) return '📄';
    
    const iconMap = {
      // Google Apps
      'application/vnd.google-apps.document': '📝',
      'application/vnd.google-apps.spreadsheet': '📊',
      'application/vnd.google-apps.presentation': '📊',
      'application/vnd.google-apps.folder': '📁',
      'application/vnd.google-apps.form': '📋',
      'application/vnd.google-apps.drawing': '🎨',
      
      // Images
      'image/jpeg': '🖼️',
      'image/jpg': '🖼️',
      'image/png': '🖼️',
      'image/gif': '🖼️',
      'image/bmp': '🖼️',
      'image/webp': '🖼️',
      'image/svg+xml': '🎨',
      
      // Documents
      'application/pdf': '📄',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'text/plain': '📄',
      'text/html': '🌐',
      'text/css': '🎨',
      'text/javascript': '⚡',
      'application/json': '📋',
      
      // Spreadsheets
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'text/csv': '📊',
      
      // Presentations
      'application/vnd.ms-powerpoint': '📊',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
      
      // Videos
      'video/mp4': '🎥',
      'video/avi': '🎥',
      'video/mov': '🎥',
      'video/wmv': '🎥',
      'video/webm': '🎥',
      
      // Audio
      'audio/mp3': '🎵',
      'audio/wav': '🎵',
      'audio/ogg': '🎵',
      'audio/mpeg': '🎵',
      
      // Archives
      'application/zip': '📦',
      'application/rar': '📦',
      'application/7z': '📦',
      'application/x-tar': '📦',
    };

    // Check for exact match first
    if (iconMap[mimeType]) {
      return iconMap[mimeType];
    }

    // Check for partial matches
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('text/')) return '📄';
    if (mimeType.includes('document')) return '📝';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';

    return '📄'; // Default icon
  },

  /**
   * Format file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  formatFileSize: (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format date in a readable format
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  formatDate: (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    } else {
      return date.toLocaleDateString();
    }
  },

  /**
   * Check if file is an image
   * @param {string} mimeType - File MIME type
   * @returns {boolean} - True if file is an image
   */
  isImage: (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  },

  /**
   * Check if file is a Google Apps file
   * @param {string} mimeType - File MIME type
   * @returns {boolean} - True if file is a Google Apps file
   */
  isGoogleApp: (mimeType) => {
    return mimeType && mimeType.startsWith('application/vnd.google-apps');
  }
};

export default googleDriveService;
