# AWS S3 Integration for TaskNest

This document explains how the AWS S3 integration works in the TaskNest application for file uploads, downloads, and management.

## Overview

TaskNest integrates with AWS S3 to provide secure file storage for projects and tasks. Files can be attached to both projects and tasks, allowing for better organization and collaboration.

## Features

- Secure file uploads via presigned URLs
- Progress tracking during uploads
- File downloads with temporary URLs
- File organization by project and task
- File listing and retrieval
- File deletion
- Support for all common file types
- Max file size configuration

## Technical Implementation

### Backend

1. **Configuration**
   - Located in `/backend/src/config/s3.js`
   - Uses AWS SDK for S3 operations
   - Configured via environment variables

2. **File Service**
   - Located in `/backend/src/services/file.service.js`
   - Provides utility methods for file operations
   - Handles file organization and key generation

3. **API Endpoints**
   - Located in `/backend/src/routes/file.routes.js`
   - Provides RESTful API for file operations
   - Endpoints include:
     - `POST /api/files/upload-url` - Generate presigned upload URL
     - `POST /api/files/metadata` - Save file metadata after upload
     - `GET /api/files/download/:key` - Get file download URL
     - `GET /api/files` - List files (filtered by project/task)
     - `DELETE /api/files/:key` - Delete a file

### Frontend

1. **File Service**
   - Located in `/frontend/src/services/fileService.js`
   - Provides methods to interact with the backend file API
   - Handles upload progress tracking and error management

2. **FileUploader Component**
   - Located in `/frontend/src/components/common/FileUploader.jsx`
   - Reusable component for file uploads
   - Features:
     - File type validation
     - File size validation
     - Multiple file support
     - Upload progress tracking
     - Error handling

3. **Integration Examples**
   - Project Details: `/frontend/src/pages/projects/ProjectDetails.jsx`
   - Task Details: `/frontend/src/pages/tasks/TaskDetails.jsx`

## Environment Variables

The following environment variables are required for S3 integration:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name
```

## Usage

### Adding File Upload to a Component

1. Import the FileUploader component:
   ```jsx
   import FileUploader from '../components/common/FileUploader';
   ```

2. Add state for managing files:
   ```jsx
   const [showFileUploader, setShowFileUploader] = useState(false);
   const [files, setFiles] = useState([]);
   const [loadingFiles, setLoadingFiles] = useState(false);
   ```

3. Add methods to fetch, upload, download, and delete files:
   ```jsx
   // Fetch files for a project or task
   const fetchFiles = async () => {
     try {
       setLoadingFiles(true);
       const files = await fileService.listFiles({ projectId: id });
       setFiles(files);
       setLoadingFiles(false);
     } catch (error) {
       console.error('Error fetching files:', error);
       toast.error('Failed to load files');
       setLoadingFiles(false);
     }
   };

   // Handle file upload completion
   const handleFileUpload = (uploadedFiles) => {
     fetchFiles();
     setShowFileUploader(false);
     toast.success('Files uploaded successfully');
   };

   // Download a file
   const handleFileDownload = async (fileKey) => {
     try {
       const downloadUrl = await fileService.getDownloadUrl(fileKey);
       window.open(downloadUrl, '_blank');
     } catch (error) {
       toast.error('Failed to download file');
     }
   };

   // Delete a file
   const handleFileDelete = async (fileKey) => {
     if (window.confirm('Are you sure you want to delete this file?')) {
       try {
         await fileService.deleteFile(fileKey);
         fetchFiles();
         toast.success('File deleted successfully');
       } catch (error) {
         toast.error('Failed to delete file');
       }
     }
   };
   ```

4. Add the FileUploader component to your UI:
   ```jsx
   {showFileUploader && (
     <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
       <FileUploader 
         onUpload={handleFileUpload} 
         multiple={true} 
         maxSize={50}
         allowedTypes="pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif"
         projectId={projectId}  // Optional - only if in a project context
         taskId={taskId}        // Optional - only if in a task context
       />
     </div>
   )}
   ```

## Best Practices

1. Always validate file types and sizes on both frontend and backend
2. Use temporary presigned URLs for both uploads and downloads
3. Include progress indicators for file uploads
4. Organize files by project and task
5. Consider implementing file versioning for important documents
6. Set up proper S3 bucket permissions and policies
7. Implement retry logic for large file uploads

## Security Considerations

1. AWS credentials are stored as environment variables
2. Presigned URLs expire after a short time
3. File access is controlled via backend authentication
4. File permissions follow the same access control as projects and tasks
