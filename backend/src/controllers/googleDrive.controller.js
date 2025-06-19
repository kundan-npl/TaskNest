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
    'https://www.googleapis.com/auth/drive.readonly'
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
    const result = await drive.files.list({
      q: 'trashed = false',
      fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)'
    });
    res.json({ success: true, files: result.data.files });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list Google Drive files' });
  }
};
