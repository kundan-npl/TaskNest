import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import fileService from '../../services/fileService';

const FileUploader = ({ onUpload, multiple = false, allowedTypes = '*', maxSize = 5, projectId, taskId }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const fileInputRef = useRef(null);
  
  // Convert bytes to readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Filter files by size and type
    const validFiles = selectedFiles.filter(file => {
      // Check file type if specified
      if (allowedTypes !== '*') {
        const fileTypes = allowedTypes.split(',').map(type => type.trim());
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!fileTypes.includes(fileExtension) && !fileTypes.includes('.' + fileExtension)) {
          toast.error(`Invalid file type: ${file.name}. Allowed types: ${allowedTypes}`);
          return false;
        }
      }
      
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Max size: ${maxSize}MB`);
        return false;
      }
      
      return true;
    });
    
    if (multiple) {
      setFiles([...files, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1)); // Only take the first file if multiple is false
    }
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.warning('Please select files to upload');
      return;
    }
    
    setUploading(true);
    setProgress(0);
    setCurrentFileIndex(0);
    
    const uploadedFiles = [];
    
    try {
      // Process each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileIndex(i);
        setProgress(0);
        
        try {
          // Step 1: Get a presigned upload URL
          const uploadData = await fileService.getUploadUrl({
            filename: file.name,
            contentType: file.type,
            projectId,
            taskId
          });
          
          // Step 2: Upload the file to S3 using the presigned URL
          await fileService.uploadFileWithSignedUrl(
            uploadData.uploadUrl,
            file,
            (percentComplete) => setProgress(percentComplete)
          );
          
          // Step 3: Save the file metadata to the database
          const fileMetadata = await fileService.saveFileMetadata({
            key: uploadData.key,
            filename: file.name,
            contentType: file.type,
            size: file.size,
            projectId,
            taskId
          });
          
          uploadedFiles.push(fileMetadata);
          
          // Small delay to show 100% progress before moving to next file
          if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
          
          // Continue with next file instead of stopping the entire batch
          continue;
        }
      }
      
      if (uploadedFiles.length > 0) {
        // At least some files were uploaded successfully
        onUpload(multiple ? uploadedFiles : uploadedFiles[0]);
        
        if (uploadedFiles.length === files.length) {
          toast.success(`Successfully uploaded ${files.length} file(s)`);
        } else {
          toast.info(`Uploaded ${uploadedFiles.length} of ${files.length} file(s)`);
        }
        
        setFiles([]);
      } else {
        toast.error('No files were uploaded successfully');
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 ${
          uploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-primary-500 bg-gray-50 hover:bg-gray-100'
        } transition-colors cursor-pointer text-center`}
        onClick={uploading ? null : triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          multiple={multiple}
          disabled={uploading}
        />
        
        {!uploading ? (
          <>
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900">
              Drop files here or click to upload
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {multiple ? 'Upload multiple files' : 'Upload a single file'} up to {maxSize}MB
              {allowedTypes !== '*' && ` (Allowed: ${allowedTypes})`}
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <svg className="mx-auto animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <div className="text-sm font-medium text-gray-900">
                Uploading {currentFileIndex + 1} of {files.length}: {files[currentFileIndex]?.name}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{progress}% complete</span>
                <span>File {currentFileIndex + 1}/{files.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {files.length > 0 && !uploading && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">{files.length} file(s) selected</h3>
            <button
              type="button"
              onClick={handleUpload}
              className="btn-primary"
            >
              Upload Files
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-auto">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {file.type.startsWith('image/') ? (
                      <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 overflow-hidden">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
