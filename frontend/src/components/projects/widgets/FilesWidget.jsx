import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import googleDriveService from '../../../services/googleDriveService';

const FilesWidget = ({ 
  project, 
  userRole, 
  permissions = {},
  className 
}) => {
  const [googleDriveFiles, setGoogleDriveFiles] = useState([]);
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid' - default to list
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const fileInputRef = useRef(null);

  const isProjectCreator = userRole === 'owner' || userRole === 'creator' || userRole === 'supervisor';
  
  // Check if user can upload files - fallback to true for all members if permissions not properly set
  const canUploadFiles = permissions?.canManageFiles !== undefined 
    ? permissions.canManageFiles 
    : (userRole && userRole !== 'viewer'); // Allow upload for all roles except viewer

  // Check if Google Drive is connected
  useEffect(() => {
    const checkDriveStatus = async () => {
      if (!project?._id && !project?.id) return;
      try {
        const connected = await googleDriveService.getConnectionStatus(project._id || project.id);
        setGoogleDriveConnected(connected);
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
        const files = await googleDriveService.listFiles(project._id || project.id);
        setGoogleDriveFiles(files);
      } catch (err) {
        console.error('Failed to fetch Google Drive files:', err);
        toast.error('Failed to fetch Google Drive files');
      } finally {
        setGoogleDriveLoading(false);
      }
    };
    fetchDriveFiles();
  }, [googleDriveConnected, project?._id, project?.id]);

  // Listen for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('driveLinked') === '1') {
      setGoogleDriveConnected(true);
      // Remove the param from URL
      params.delete('driveLinked');
      window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
      toast.success('Google Drive linked successfully!');
    }
  }, []);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu && !event.target.closest('[data-options-menu]')) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptionsMenu]);

  const handleConnectGoogleDrive = async () => {
    // Show under development message
    toast.info('🚧 Google Drive integration is currently under development. This feature will be available soon!', {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    return;
    
    // Original code preserved for future use
    /*
    if (!project?._id && !project?.id) return;
    try {
      const authUrl = await googleDriveService.getAuthUrl(project._id || project.id);
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to get auth URL:', err);
      toast.error('Failed to connect Google Drive');
    }
    */
  };

  const handleUnlinkGoogleDrive = async () => {
    if (!window.confirm('Are you sure you want to unlink Google Drive? This will remove access to all files in the Drive folder for this project.')) {
      return;
    }

    try {
      setGoogleDriveLoading(true);
      await googleDriveService.unlinkDrive(project._id || project.id);
      setGoogleDriveConnected(false);
      setGoogleDriveFiles([]);
      setShowOptionsMenu(false);
      toast.success('Google Drive unlinked successfully');
    } catch (error) {
      console.error('Failed to unlink Google Drive:', error);
      toast.error('Failed to unlink Google Drive');
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleFileUpload = async (files) => {
    // Check if user has permission to upload files
    if (!canUploadFiles) {
      toast.error('You do not have permission to upload files');
      return;
    }

    setUploading(true);
    const uploadResults = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `upload-${Date.now()}-${i}`;

        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          const uploadedFile = await googleDriveService.uploadFile(
            project._id || project.id,
            file,
            (progress) => {
              setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
            }
          );

          uploadResults.push(uploadedFile);
          setGoogleDriveFiles(prev => [uploadedFile, ...prev]);

        } catch (fileError) {
          console.error(`Failed to upload ${file.name}:`, fileError);
          toast.error(`Failed to upload ${file.name}`);
        } finally {
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles);
    }
  };

  const handleDownload = async (file) => {
    try {
      const downloadInfo = await googleDriveService.getDownloadUrl(
        project._id || project.id,
        file.id
      );
      
      if (downloadInfo.isExport) {
        // For Google Apps files, open in new tab for export
        window.open(downloadInfo.downloadUrl, '_blank');
      } else {
        // For regular files, trigger download
        const link = document.createElement('a');
        link.href = downloadInfo.downloadUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (file) => {
    if (!isProjectCreator) {
      toast.error('Only project creators can delete files');
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        await googleDriveService.deleteFile(project._id || project.id, file.id);
        setGoogleDriveFiles(prev => prev.filter(f => f.id !== file.id));
        toast.success('File deleted successfully');
      } catch (error) {
        console.error('Delete failed:', error);
        toast.error('Failed to delete file');
      }
    }
  };

  const handlePreview = (file) => {
    if (googleDriveService.isImage(file.mimeType) || file.webViewLink) {
      setShowPreview(file);
    } else {
      handleDownload(file);
    }
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const filteredFiles = googleDriveFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug permissions
  console.log('FilesWidget permissions:', permissions);
  console.log('Can manage files:', permissions?.canManageFiles);
  console.log('User role:', userRole);

  // If Google Drive is not connected, show connection UI
  if (!googleDriveConnected) {
    return (
      <div className={`widget-card ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 48 48">
              <path fill="#2196F3" d="M25.5 6.938l-3.5 6.062 10.5 18.188 3.5-6.062z"/>
              <path fill="#4CAF50" d="M12.5 41.062h23l-3.5-6.062h-16z"/>
              <path fill="#FFC107" d="M12.5 41.062l10.5-18.188-3.5-6.062-10.5 18.188z"/>
              <path fill="#F44336" d="M35.5 41.062l-10.5-18.188 3.5-6.062 10.5 18.188z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect Google Drive</h3>
          <p className="text-gray-600 mb-8 text-center max-w-sm leading-relaxed">
            Connect your Google Drive to enable seamless file sharing and collaboration for this project. 
            All team members will have access to shared files.
          </p>
          {isProjectCreator && (
            <button 
              onClick={handleConnectGoogleDrive}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-base font-medium shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                <path fill="#2196F3" d="M25.5 6.938l-3.5 6.062 10.5 18.188 3.5-6.062z"/>
                <path fill="#4CAF50" d="M12.5 41.062h23l-3.5-6.062h-16z"/>
                <path fill="#FFC107" d="M12.5 41.062l10.5-18.188-3.5-6.062-10.5 18.188z"/>
                <path fill="#F44336" d="M35.5 41.062l-10.5-18.188 3.5-6.062 10.5 18.188z"/>
              </svg>
              Connect Google Drive
            </button>
          )}
          {!isProjectCreator && (
            <div className="text-sm text-gray-500 bg-gray-100 rounded-lg px-4 py-2">
              Only project creators can connect Google Drive
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`widget-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg">
            <svg className="h-6 w-6 text-green-600 dark:text-green-300" viewBox="0 0 48 48">
              <path fill="#2196F3" d="M25.5 6.938l-3.5 6.062 10.5 18.188 3.5-6.062z"/>
              <path fill="#4CAF50" d="M12.5 41.062h23l-3.5-6.062h-16z"/>
              <path fill="#FFC107" d="M12.5 41.062l10.5-18.188-3.5-6.062-10.5 18.188z"/>
              <path fill="#F44336" d="M35.5 41.062l-10.5-18.188 3.5-6.062 10.5 18.188z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Drive Files</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Upload Button */}
          {canUploadFiles && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </>
              )}
            </button>
          )}

          {/* Options Menu (Three Dots) */}
          {isProjectCreator && (
            <div className="relative" data-options-menu>
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showOptionsMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={handleUnlinkGoogleDrive}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12l6.121-6.122" />
                      </svg>
                      Unlink Google Drive
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="mb-4 space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between text-sm text-blue-700 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files Grid/List */}
      {googleDriveLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading files...</p>
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No files match your search.' : 'Upload files to get started.'}
          </p>
          {canUploadFiles && !searchTerm && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Upload first file
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-max" 
          : "space-y-2"
        }>
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              viewMode={viewMode}
              isSelected={selectedFiles.includes(file.id)}
              onSelect={() => toggleFileSelection(file.id)}
              onPreview={() => handlePreview(file)}
              onDownload={() => handleDownload(file)}
              onDelete={() => handleDelete(file)}
              canDelete={isProjectCreator}
            />
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="*/*"
      />

      {/* Preview Modal */}
      {showPreview && (
        <FilePreviewModal
          file={showPreview}
          onClose={() => setShowPreview(null)}
          onDownload={() => handleDownload(showPreview)}
        />
      )}
    </div>
  );
};

// File Card Component
const FileCard = ({ file, viewMode, isSelected, onSelect, onPreview, onDownload, onDelete, canDelete }) => {
  const fileIcon = googleDriveService.getFileIcon(file.mimeType);
  const fileSize = googleDriveService.formatFileSize(file.size);
  const modifiedDate = googleDriveService.formatDate(file.modifiedTime);

  if (viewMode === 'list') {
    return (
      <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex-shrink-0 mr-3">
          <div className="text-2xl">{fileIcon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {fileSize} • {modifiedDate}
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={onPreview}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={onDownload}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 group h-full overflow-hidden">
      <div className="p-3 h-full flex flex-col min-h-[140px]">
        <div className="flex items-start justify-between mb-2">
          <div className="text-2xl flex-shrink-0">{fileIcon}</div>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={onPreview}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Preview"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={onDownload}
              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Download"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            {canDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col justify-between">
          <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2 leading-tight overflow-hidden" 
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
              title={file.name}>
            {file.name}
          </h4>
          <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 mt-auto">
            <span className="truncate">{fileSize}</span>
            <span className="truncate">{modifiedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// File Preview Modal Component
const FilePreviewModal = ({ file, onClose, onDownload }) => {
  const isImage = googleDriveService.isImage(file.mimeType);
  const isGoogleApp = googleDriveService.isGoogleApp(file.mimeType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{googleDriveService.getFileIcon(file.mimeType)}</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {googleDriveService.formatFileSize(file.size)} • {googleDriveService.formatDate(file.modifiedTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownload}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Download"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4">
          {isImage && file.thumbnailLink ? (
            <div className="flex justify-center">
              <img 
                src={file.thumbnailLink} 
                alt={file.name}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          ) : isGoogleApp && file.webViewLink ? (
            <div className="h-[60vh]">
              <iframe
                src={file.webViewLink}
                className="w-full h-full border-0 rounded-lg"
                title={file.name}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">{googleDriveService.getFileIcon(file.mimeType)}</div>
              <p className="text-gray-500 mb-4">Preview not available for this file type</p>
              <button
                onClick={onDownload}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilesWidget;
