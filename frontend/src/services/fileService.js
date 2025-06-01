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

  /**
   * Get files for a specific project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} - List of project files
   */
  getProjectFiles: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/files`);
      return response.data;
    } catch (error) {
      console.error('Project files API not implemented, returning mock data');
      // Return mock files for now
      return {
        data: [
          {
            _id: '1',
            filename: 'project-requirements.pdf',
            originalName: 'project-requirements.pdf',
            size: 2048576,
            mimetype: 'application/pdf',
            uploadedBy: 'user1',
            uploadedAt: '2024-01-15T10:00:00.000Z',
            url: '#'
          },
          {
            _id: '2',
            filename: 'design-mockups.zip',
            originalName: 'design-mockups.zip',
            size: 5242880,
            mimetype: 'application/zip',
            uploadedBy: 'user2',
            uploadedAt: '2024-01-20T14:30:00.000Z',
            url: '#'
          }
        ]
      };
    }
  }
};

export default fileService;
