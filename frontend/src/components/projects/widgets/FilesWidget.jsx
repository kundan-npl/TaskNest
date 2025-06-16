import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import fileService from '../../../services/fileService';

const FilesWidget = ({ 
  files: propFiles = [], 
  project, 
  userRole, 
  permissions = {},
  onFileUpload,
  onFileDelete,
  className 
}) => {
  const [files, setFiles] = useState(propFiles);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Google Drive integration (backend-driven)
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [googleDriveFiles, setGoogleDriveFiles] = useState([]);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);

  // Robust project creator check
  const currentUserId = window?.currentUser?._id;
  const projectCreatorId =
    typeof project?.createdBy === 'object'
      ? project?.createdBy?._id
      : project?.createdBy;
  const isProjectCreator = currentUserId && projectCreatorId && currentUserId.toString() === projectCreatorId.toString();

  // Update local state when prop changes
  useEffect(() => {
    // Only update if propFiles is different (by length or ids)
    if (
      propFiles.length !== files.length ||
      propFiles.some((f, i) => f._id !== files[i]?._id)
    ) {
      setFiles(propFiles);
    }
    // eslint-disable-next-line
  }, [propFiles]);

  // Fetch files when project changes
  useEffect(() => {
    if (project?._id || project?.id) {
      fetchFiles();
    }
  }, [project?._id, project?.id]);

  // Helper to get JWT token from localStorage (if present)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Check if Google Drive is connected (via backend)
  useEffect(() => {
    const checkDriveStatus = async () => {
      if (!project?._id && !project?.id) return;
      try {
        const res = await fetch(`/api/v1/projects/${project._id || project.id}/drive/status`, {
          credentials: 'include',
          headers: { ...getAuthHeaders() }
        });
        const data = await res.json();
        setGoogleDriveConnected(!!data.connected);
      } catch (err) {
        setGoogleDriveConnected(false);
      }
    };
    checkDriveStatus();
  }, [project?._id, project?.id]);

  // Fetch Google Drive files if connected
  useEffect(() => {
    const fetchDriveFiles = async () => {
      if (!googleDriveConnected || !project?._id && !project?.id) return;
      setGoogleDriveLoading(true);
      try {
        const res = await fetch(`/api/v1/projects/${project._id || project.id}/drive/files`, {
          credentials: 'include',
          headers: { ...getAuthHeaders() }
        });
        const data = await res.json();
        setGoogleDriveFiles(data.files || []);
      } catch (err) {
        toast.error('Failed to fetch Google Drive files');
      } finally {
        setGoogleDriveLoading(false);
      }
    };
    fetchDriveFiles();
  }, [googleDriveConnected, project?._id, project?.id]);

  const fetchFiles = async () => {
    if (!project?._id && !project?.id) return;
    
    try {
      setLoading(true);
      // For now, show placeholder for enterprise storage integration
      console.log('Files widget: Enterprise storage integration pending');
      setFiles([
        {
          _id: 'placeholder-1',
          filename: 'Enterprise Storage Integration',
          originalName: 'enterprise-storage.md',
          size: 1024,
          uploadedBy: { name: 'System' },
          uploadedAt: new Date(),
          type: 'document',
          isPlaceholder: true
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      // Don't show error for placeholder
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'xls':
      case 'xlsx':
        return (
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'zip':
      case 'rar':
        return (
          <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    handleFileUpload(selectedFiles);
  };

  const handleFileUpload = async (filesToUpload) => {
    if (!permissions?.canUpload) {
      toast.error('You do not have permission to upload files');
      return;
    }

    setUploading(true);
    const uploadResults = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const fileId = `upload-${Date.now()}-${i}`;

        // Initialize progress tracking
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          // Get upload URL
          const uploadData = await fileService.getUploadUrl({
            filename: file.name,
            contentType: file.type,
            projectId: project._id || project.id
          });

          // Upload file with progress tracking
          await fileService.uploadFileWithSignedUrl(
            uploadData.uploadUrl,
            file,
            (progress) => {
              setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
            }
          );

          // Save metadata
          const savedFile = await fileService.saveFileMetadata({
            ...uploadData.metadata,
            projectId: project._id || project.id
          });

          // Update local state
          const newFile = {
            _id: savedFile._id || fileId,
            filename: file.name,
            originalName: file.name,
            size: file.size,
            mimetype: file.type,
            uploadedBy: savedFile.uploadedBy || 'current-user',
            uploadedAt: savedFile.uploadedAt || new Date().toISOString(),
            url: savedFile.url,
            key: savedFile.key
          };

          setFiles(prev => [...prev, newFile]);
          uploadResults.push(newFile);

          if (onFileUpload) {
            onFileUpload(newFile);
          }
        } catch (fileError) {
          console.error(`Failed to upload ${file.name}:`, fileError);
          toast.error(`Failed to upload ${file.name}: ${fileError.message}`);
        } finally {
          // Clean up progress tracking
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }
      }

      if (uploadResults.length > 0) {
        toast.success(`${uploadResults.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  const handleDownload = async (file) => {
    try {
      let downloadUrl = file.url;
      
      // If file has a key, get a fresh download URL
      if (file.key) {
        downloadUrl = await fileService.getDownloadUrl(file.key);
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || file.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (file) => {
    if (!permissions?.canDelete) {
      toast.error('You do not have permission to delete files');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      try {
        // Delete from server
        if (file.key) {
          await fileService.deleteFile(file.key);
        }
        
        // Update local state
        setFiles(prev => prev.filter(f => f._id !== file._id));
        
        if (onFileDelete) {
          onFileDelete(file._id);
        }
        
        toast.success('File deleted successfully');
      } catch (error) {
        console.error('Delete failed:', error);
        toast.error('Failed to delete file');
      }
    }
  };

  const handleBulkDownload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to download');
      return;
    }

    try {
      for (const fileId of selectedFiles) {
        const file = files.find(f => f._id === fileId);
        if (file) {
          await handleDownload(file);
          // Add delay between downloads to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      toast.error('Failed to download some files');
    }
  };

  const handleBulkDelete = async () => {
    if (!permissions?.canDelete) {
      toast.error('You do not have permission to delete files');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select files to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) {
      try {
        for (const fileId of selectedFiles) {
          const file = files.find(f => f._id === fileId);
          if (file && file.key) {
            await fileService.deleteFile(file.key);
          }
        }
        
        setFiles(prev => prev.filter(f => !selectedFiles.includes(f._id)));
        setSelectedFiles([]);
        
        toast.success(`${selectedFiles.length} files deleted successfully`);
      } catch (error) {
        toast.error('Failed to delete some files');
      }
    }
  };

  const handleFileSelection = (fileId, checked) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFiles(filteredFiles.map(f => f._id));
    } else {
      setSelectedFiles([]);
    }
  };

  const filteredFiles = files.filter(file =>
    file.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.filename.localeCompare(b.filename);
      case 'size':
        return b.size - a.size;
      case 'date':
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      default:
        return 0;
    }
  });

  const handleConnectGoogleDrive = async () => {
    if (!project?._id && !project?.id) return;
    try {
      const res = await fetch(`/api/v1/projects/${project._id || project.id}/drive/auth-url`, {
        credentials: 'include',
        headers: { ...getAuthHeaders() }
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to get Google Drive auth URL');
      }
    } catch (err) {
      toast.error('Failed to connect Google Drive');
    }
  };

  // Listen for OAuth callback (redirect with ?driveLinked=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('driveLinked') === '1') {
      setGoogleDriveConnected(true);
      // Optionally, remove the param from URL
      params.delete('driveLinked');
      window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
    }
  }, []);

  // In the return JSX, replace the main content with this logic:
  if (!googleDriveConnected) {
    return (
      <div className={`widget-card flex flex-col items-center justify-center min-h-[300px] ${className}`}>
        <svg className="h-16 w-16 text-blue-500 mb-4" viewBox="0 0 48 48"><path fill="#2196F3" d="M25.5 6.938l-3.5 6.062 10.5 18.188 3.5-6.062z"/><path fill="#4CAF50" d="M12.5 41.062h23l-3.5-6.062h-16z"/><path fill="#FFC107" d="M12.5 41.062l10.5-18.188-3.5-6.062-10.5 18.188z"/><path fill="#F44336" d="M35.5 41.062l-10.5-18.188 3.5-6.062 10.5 18.188z"/></svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Link Google Drive</h3>
        <p className="text-gray-600 mb-6 text-center max-w-xs">To enable file sharing for this project, the project creator must link a Google Drive account. Once linked, all members will have seamless access to shared files here.</p>
        <button onClick={handleConnectGoogleDrive} className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium shadow hover:bg-blue-700 transition">Link Google Drive</button>
      </div>
    );
  }

  return (
    <div className={`widget-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <svg className="h-5 w-5 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Files & Documents</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{files.length} file{files.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
            >
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
            >
              <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedFiles.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                {selectedFiles.length} selected
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleBulkDownload}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  Download
                </button>
                {permissions?.canDelete && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {permissions?.canUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              Upload
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* File Upload Area */}
      {permissions?.canUpload && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 transition-colors ${
            dragOver
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900 dark:text-white">Drop files here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">or click to browse</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* Google Drive Integration */}
      {googleDriveConnected ? (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-green-500" viewBox="0 0 48 48"><path fill="#2196F3" d="M25.5 6.938l-3.5 6.062 10.5 18.188 3.5-6.062z"/><path fill="#4CAF50" d="M12.5 41.062h23l-3.5-6.062h-16z"/><path fill="#FFC107" d="M12.5 41.062l10.5-18.188-3.5-6.062-10.5 18.188z"/><path fill="#F44336" d="M35.5 41.062l-10.5-18.188 3.5-6.062 10.5 18.188z"/></svg>
            <span className="text-green-700 font-medium">Google Drive Connected</span>
            {isProjectCreator && (
              <button onClick={() => { localStorage.removeItem(`gdrive_token_${project?._id || project?.id}`); setGoogleDriveConnected(false); }} className="ml-2 text-xs text-red-600 underline">Disconnect</button>
            )}
          </div>
          {googleDriveLoading ? (
            <div className="mt-2 text-sm text-gray-500">Loading Google Drive files...</div>
          ) : (
            <div className="mt-4 max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {googleDriveFiles.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">No files found in Google Drive</div>
              ) : googleDriveFiles.map(file => (
                <a key={file.id} href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white rounded shadow hover:bg-gray-50">
                  <img src={file.iconLink} alt="icon" className="h-8 w-8" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{file.name}</div>
                    <div className="text-xs text-gray-500">{file.mimeType}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Files List/Grid */}
      <div className={`max-h-96 overflow-y-auto ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-4' : 'space-y-3'}`}>
        {sortedFiles.length === 0 ? (
          <div className={`text-center py-8 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No files</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No files match your search.' : 'Get started by uploading files.'}
            </p>
          </div>
        ) : (
          sortedFiles.map((file) => (
            <div
              key={file._id}
              className={`${
                viewMode === 'grid'
                  ? 'flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors'
                  : 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="mb-3">
                    {getFileIcon(file.filename)}
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.filename}>
                      {file.filename}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleDownload(file)}
                      className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                      title="Download"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    {permissions?.canDelete && (
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.filename)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.filename}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                      title="Download"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    {permissions?.canDelete && (
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FilesWidget;
