// backend/src/controllers/googleDrive.controller.js
const { google } = require('googleapis');

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

// In-memory store for demo (replace with DB in production)
const projectDriveTokens = {};

exports.getDriveStatus = (req, res) => {
  const { projectId } = req.params;
  const tokens = projectDriveTokens[projectId];
  res.json({ connected: !!tokens });
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
    // Store tokens for the project (replace with DB in production)
    projectDriveTokens[state] = tokens;
    
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
  const tokens = projectDriveTokens[projectId];
  if (!tokens) return res.status(400).json({ success: false, error: 'Drive not linked' });
  
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    console.log('Fetching Google Drive files for project:', projectId);
    
    // Get the TaskNest folder for this project
    const folderId = await getOrCreateTaskNestFolder(projectId, tokens);
    
    const result = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink, thumbnailLink, downloadUrl, parents)',
      orderBy: 'modifiedTime desc'
    });
    
    console.log('Google Drive files fetched successfully:', result.data.files?.length || 0, 'files');
    res.json({ success: true, files: result.data.files || [] });
  } catch (err) {
    console.error('Google Drive files fetch error:', err.message, err.code);
    res.status(500).json({ success: false, error: 'Failed to list Google Drive files', details: err.message });
  }
};

exports.uploadFile = async (req, res) => {
  const { projectId } = req.params;
  const tokens = projectDriveTokens[projectId];
  if (!tokens) return res.status(400).json({ success: false, error: 'Drive not linked' });
  
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    console.log('Uploading file to Google Drive for project:', projectId);
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }
    
    // Get the TaskNest folder for this project
    const folderId = await getOrCreateTaskNestFolder(projectId, tokens);
    
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
    res.status(500).json({ success: false, error: 'Failed to upload file to Google Drive', details: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  const { projectId, fileId } = req.params;
  const tokens = projectDriveTokens[projectId];
  if (!tokens) return res.status(400).json({ success: false, error: 'Drive not linked' });
  
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    console.log('Deleting file from Google Drive:', fileId);
    
    await drive.files.delete({ fileId });
    
    console.log('File deleted successfully:', fileId);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error('Google Drive delete error:', err.message, err.code);
    res.status(500).json({ success: false, error: 'Failed to delete file from Google Drive', details: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  const { projectId, fileId } = req.params;
  const tokens = projectDriveTokens[projectId];
  if (!tokens) return res.status(400).json({ success: false, error: 'Drive not linked' });
  
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
  try {
    console.log('Getting download link for file:', fileId);
    
    // Get file metadata first
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'name, mimeType, webViewLink, webContentLink'
    });
    
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
  oauth2Client.setCredentials(tokens);
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
  oauth2Client.setCredentials(tokens);
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
