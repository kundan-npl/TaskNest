const mongoose = require('mongoose');
const crypto = require('crypto');

const projectDriveTokenSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true
  },
  encryptedTokens: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

// Encryption key from environment variable
const ENCRYPTION_KEY = process.env.DRIVE_TOKEN_ENCRYPTION_KEY || 'fallback-32-byte-encryption-key!!';
const ALGORITHM = 'aes-256-cbc';

// Ensure the key is exactly 32 bytes for AES-256
let key = Buffer.from(ENCRYPTION_KEY);
if (key.length < 32) {
  const padding = Buffer.alloc(32 - key.length, 0);
  key = Buffer.concat([key, padding]);
} else if (key.length > 32) {
  key = key.subarray(0, 32);
}

if (!process.env.DRIVE_TOKEN_ENCRYPTION_KEY) {
  console.warn('WARNING: Using fallback encryption key. Set DRIVE_TOKEN_ENCRYPTION_KEY environment variable for production.');
}

// Helper methods for encryption/decryption
projectDriveTokenSchema.methods.setTokens = function(tokens) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(tokens), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  this.encryptedTokens = iv.toString('hex') + ':' + encrypted;
  this.updatedAt = new Date();
};

projectDriveTokenSchema.methods.getTokens = function() {
  try {
    const textParts = this.encryptedTokens.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error decrypting tokens:', error);
    return null;
  }
};

projectDriveTokenSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

// Static method to find tokens by project ID
projectDriveTokenSchema.statics.findByProjectId = function(projectId) {
  return this.findOne({ projectId });
};

// Static method to store tokens
projectDriveTokenSchema.statics.storeTokens = async function(projectId, tokens) {
  let tokenRecord = await this.findByProjectId(projectId);
  
  if (tokenRecord) {
    tokenRecord.setTokens(tokens);
    await tokenRecord.save();
  } else {
    tokenRecord = new this({ projectId });
    tokenRecord.setTokens(tokens);
    await tokenRecord.save();
  }
  
  return tokenRecord;
};

// Static method to remove tokens (for unlinking)
projectDriveTokenSchema.statics.removeTokens = function(projectId) {
  return this.deleteOne({ projectId });
};

// Index for better performance
projectDriveTokenSchema.index({ projectId: 1 });
projectDriveTokenSchema.index({ lastUsed: 1 });

module.exports = mongoose.model('ProjectDriveToken', projectDriveTokenSchema);
