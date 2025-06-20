// backend/src/controllers/googleDrive.controller.js
const { google } = require('googleapis');
const ProjectDriveToken = require('../models/projectDriveToken.model');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI;

console.log('Google Drive Config:', {
  CLIENT_ID: CLIENT_ID ? `${CLIENT_ID.substring(0, 20)}...` : 'MISSING',
  CLIENT_SECRET: CLIENT_SECRET ? `${CLIENT_SECRET.substring(0, 10)}...` : 'MISSING',
  REDIRECT_URI: REDIRECT_URI || 'MISSING'
});

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Helper function to set credentials and handle token refresh
const setCredentialsWithRefresh = async (projectId, oauth2Client, tokens) => {
  oauth2Client.setCredentials(tokens);
  
  // Set up token refresh handler
  oauth2Client.on('tokens', async (newTokens) => {
    try {
      console.log('New tokens received, updating database for project:', projectId);
      const updatedTokens = { ...tokens, ...newTokens };
      await ProjectDriveToken.storeTokens(projectId, updatedTokens);
    } catch (error) {
      console.error('Failed to store refreshed tokens:', error);
    }
  });
};

exports.getDriveStatus = async (req, res) => {
  const { projectId } = req.params;
  try {
    const tokenRecord = await ProjectDriveToken.findByProjectId(projectId);
    res.json({ connected: !!tokenRecord });
  } catch (error) {
    console.error('Error checking drive status:', error);
    res.json({ connected: false });
  }
};

exports.getAuthUrl = (req, res) => {
  const { projectId } = req.params;
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive'
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: projectId
  });
  console.log('Generated auth URL for project:', projectId);
  res.json({ url });
};

exports.oauthCallback = async (req, res) => {
  const { code, state } = req.query;
  console.log('OAuth Callback received:', { 
    code: code ? `${code.substring(0, 20)}...` : 'MISSING',
    state: state || 'MISSING',
    query: req.query 
  });
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('OAuth tokens received successfully for project:', state);
    
    // Store tokens in database
    await ProjectDriveToken.storeTokens(state, tokens);
    console.log('Tokens stored in database for project:', state);
    
    // Create TaskNest folder in Drive for this project
    await createTaskNestFolder(state, tokens);
    
    // Redirect to frontend with success
    const redirectUrl = `${process.env.FRONTEND_URL}/projects/${state}?driveLinked=1`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Google Drive OAuth Error:', err);
    res.status(500).json({ success: false, error: 'Google Drive authentication failed', details: err.message });
  }
};

exports.listFiles = async (req, res) => {
  const { projectId } = req.params;
  const { taskId } = req.query; // Support task-specific file listing
  
  try {
    const tokenRecord = await ProjectDriveToken.findByProjectId(projectId);
    if (!tokenRecord) {
      return res.status(400).json({ success: false, error: 'Drive not linked' });
    }
    
    const tokens = tokenRecord.getTokens();
    if (!tokens) {
      return res.status(400).json({ success: false, error: 'Invalid stored tokens' });
    }
    
    await setCredentialsWithRefresh(projectId, oauth2Client, tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('Fetching Google Drive files for project:', projectId, taskId ? `task: ${taskId}` : '(project-level)');
    
    // Get the appropriate folder - either task-specific or project-level
    let folderId;
    if (taskId) {
      folderId = await getOrCreateTaskFolder(projectId, taskId, tokens);
    } else {
      folderId = await getOrCreateTaskNestFolder(projectId, tokens);
    }
    
    const result = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink, thumbnailLink, downloadUrl, parents)',
      orderBy: 'modifiedTime desc'
    });
    
    // Update last used timestamp
    await tokenRecord.updateLastUsed();
    
    console.log('Google Drive files fetched successfully:', result.data.files?.length || 0, 'files');
    res.json({ success: true, files: result.data.files || [] });
  } catch (err) {
    console.error('Google Drive files fetch error:', err.message, err.code);
    
    // Provide specific error messages for common issues
    if (err.code === 403 && err.message.includes('Drive API has not been used')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Google Drive API is not enabled. Please enable it in Google Cloud Console.',
        details: 'Visit Google Cloud Console > APIs & Services > Library > Enable Google Drive API',
        actionRequired: true
      });
    }
    
    if (err.code === 401) {
      return res.status(401).json({ 
        success: false, 
        error: 'Google Drive authentication expired. Please reconnect.',
        actionRequired: true
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to list Google Drive files', details: err.message });
  }
};

exports.uploadFile = async (req, res) => {
  const { projectId } = req.params;
  const { taskId } = req.body; // Support task-specific file uploads
  
  try {
    const tokenRecord = await ProjectDriveToken.findByProjectId(projectId);
    if (!tokenRecord) {
      return res.status(400).json({ success: false, error: 'Drive not linked' });
    }
    
    const tokens = tokenRecord.getTokens();
    if (!tokens) {
      return res.status(400).json({ success: false, error: 'Invalid stored tokens' });
    }
    
    await setCredentialsWithRefresh(projectId, oauth2Client, tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('Uploading file to Google Drive for project:', projectId, taskId ? `task: ${taskId}` : '(project-level)');
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    
    // Get the appropriate folder - either task-specific or project-level
    let folderId;
    if (taskId) {
      folderId = await getOrCreateTaskFolder(projectId, taskId, tokens);
    } else {
      folderId = await getOrCreateTaskNestFolder(projectId, tokens);
    }
    
    const fileMetadata = {
      name: req.file.originalname,
      parents: [folderId]
    };
    
    const media = {
      mimeType: req.file.mimetype,
      body: require('stream').Readable.from(req.file.buffer)
    };
    
    const result = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size, webViewLink, iconLink, thumbnailLink'
    });
    
    console.log('File uploaded successfully:', result.data.name);
    res.json({ success: true, file: result.data });
  } catch (err) {
    console.error('Google Drive upload error:', err.message, err.code);
    
    // Provide specific error messages for common issues
    if (err.code === 403 && err.message.includes('Drive API has not been used')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Google Drive API is not enabled. Please enable it in Google Cloud Console.',
        details: 'Visit Google Cloud Console > APIs & Services > Library > Enable Google Drive API',
        actionRequired: true
      });
    }
    
    if (err.code === 401) {
      return res.status(401).json({ 
        success: false, 
        error: 'Google Drive authentication expired. Please reconnect.',
        actionRequired: true
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to upload file to Google Drive', details: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  const { projectId, fileId } = req.params;
  
  try {
    const tokenRecord = await ProjectDriveToken.findByProjectId(projectId);
    if (!tokenRecord) {
      return res.status(400).json({ success: false, error: 'Drive not linked' });
    }
    
    const tokens = tokenRecord.getTokens();
    if (!tokens) {
      return res.status(400).json({ success: false, error: 'Invalid stored tokens' });
    }
    
    await setCredentialsWithRefresh(projectId, oauth2Client, tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('Deleting file from Google Drive:', fileId);
    
    await drive.files.delete({ fileId });
    
    // Update last used timestamp
    await tokenRecord.updateLastUsed();
    
    console.log('File deleted successfully:', fileId);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error('Google Drive delete error:', err.message, err.code);
    res.status(500).json({ success: false, error: 'Failed to delete file from Google Drive', details: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  const { projectId, fileId } = req.params;
  
  try {
    const tokenRecord = await ProjectDriveToken.findByProjectId(projectId);
    if (!tokenRecord) {
      return res.status(400).json({ success: false, error: 'Drive not linked' });
    }
    
    const tokens = tokenRecord.getTokens();
    if (!tokens) {
      return res.status(400).json({ success: false, error: 'Invalid stored tokens' });
    }
    
    await setCredentialsWithRefresh(projectId, oauth2Client, tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('Getting download link for file:', fileId);
    
    // Get file metadata first
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType, webViewLink, webContentLink'
    });
    
    // Update last used timestamp
    await tokenRecord.updateLastUsed();
    
    // For Google Docs, Sheets, Slides, we need to export them
    if (fileMetadata.data.mimeType.includes('application/vnd.google-apps')) {
      let exportMimeType = 'application/pdf';
      if (fileMetadata.data.mimeType.includes('spreadsheet')) {
        exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (fileMetadata.data.mimeType.includes('presentation')) {
        exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      } else if (fileMetadata.data.mimeType.includes('document')) {
        exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
      res.json({ success: true, downloadUrl: exportUrl, isExport: true });
    } else {
      // For regular files, use webContentLink or generate download URL
      const downloadUrl = fileMetadata.data.webContentLink || `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      res.json({ success: true, downloadUrl: downloadUrl, isExport: false });
    }
  } catch (err) {
    console.error('Google Drive download error:', err.message, err.code);
    res.status(500).json({ success: false, error: 'Failed to get download link', details: err.message });
  }
};

// Helper function to create TaskNest folder
const createTaskNestFolder = async (projectId, tokens) => {
  await setCredentialsWithRefresh(projectId, oauth2Client, tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    const folderMetadata = {
      name: `TaskNest - Project ${projectId}`,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });
    
    console.log('Created TaskNest folder:', folder.data.id);
    return folder.data.id;
  } catch (err) {
    console.error('Error creating TaskNest folder:', err);
    return null;
  }
};

// Helper function to get or create TaskNest folder
const getOrCreateTaskNestFolder = async (projectId, tokens) => {
  await setCredentialsWithRefresh(projectId, oauth2Client, tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    // Search for existing TaskNest folder
    const folderName = `TaskNest - Project ${projectId}`;
    const result = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    if (result.data.files && result.data.files.length > 0) {
      console.log('Found existing TaskNest folder:', result.data.files[0].id);
      return result.data.files[0].id;
    } else {
      // Create new folder
      console.log('Creating new TaskNest folder for project:', projectId);
      return await createTaskNestFolder(projectId, tokens);
    }
  } catch (err) {
    console.error('Error getting/creating TaskNest folder:', err);
    throw err;
  }
};

// Helper function to get or create task-specific folder
const getOrCreateTaskFolder = async (projectId, taskId, tokens) => {
  await setCredentialsWithRefresh(projectId, oauth2Client, tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    // First get the main TaskNest folder
    const projectFolderId = await getOrCreateTaskNestFolder(projectId, tokens);
    
    // Search for existing task folder
    const taskFolderName = `Task ${taskId}`;
    const result = await drive.files.list({
      q: `name='${taskFolderName}' and mimeType='application/vnd.google-apps.folder' and '${projectFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)'
    });
    
    if (result.data.files && result.data.files.length > 0) {
      console.log('Found existing task folder:', result.data.files[0].id);
      return result.data.files[0].id;
    } else {
      // Create new task folder
      console.log('Creating new task folder for project:', projectId, 'task:', taskId);
      const folderMetadata = {
        name: taskFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [projectFolderId]
      };
      
      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });
      
      console.log('Created task folder:', folder.data.id);
      return folder.data.id;
    }
  } catch (err) {
    console.error('Error getting/creating task folder:', err);
    throw err;
  }
};

exports.unlinkDrive = async (req, res) => {
  const { projectId } = req.params;
  
  try {
    console.log('Unlinking Google Drive for project:', projectId);
    
    // Remove tokens from database
    const result = await ProjectDriveToken.removeTokens(projectId);
    
    if (result.deletedCount > 0) {
      console.log('Google Drive unlinked successfully for project:', projectId);
      res.json({ success: true, message: 'Google Drive unlinked successfully' });
    } else {
      res.status(404).json({ success: false, error: 'No Google Drive connection found' });
    }
  } catch (err) {
    console.error('Google Drive unlink error:', err);
    res.status(500).json({ success: false, error: 'Failed to unlink Google Drive', details: err.message });
  }
};
