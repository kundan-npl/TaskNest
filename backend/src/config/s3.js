// AWS S3 Configuration
const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize S3 instance
let s3Options = {};

// Use a local S3 endpoint if in development/test mode and endpoint is specified
if (process.env.NODE_ENV !== 'production' && process.env.AWS_S3_ENDPOINT) {
  s3Options.endpoint = process.env.AWS_S3_ENDPOINT;
  s3Options.s3ForcePathStyle = true;
}

// For local testing without actual AWS credentials
if (process.env.NODE_ENV === 'test' || process.env.MOCK_S3 === 'true') {
  console.log('Using mock S3 implementation for testing');
  s3Options.endpoint = 'http://localhost:4566'; // LocalStack default endpoint
  s3Options.s3ForcePathStyle = true;
  s3Options.accessKeyId = 'test';
  s3Options.secretAccessKey = 'test';
}

const s3 = new AWS.S3(s3Options);

// S3 bucket name
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'tasknest-uploads';

/**
 * Generate a presigned URL for uploading a file to S3
 * @param {string} key - The file key (path in S3 bucket)
 * @param {string} contentType - The content type of the file
 * @param {number} expiresIn - URL expiration time in seconds (default: 60)
 * @returns {Promise<string>} - Presigned URL
 */
const generateUploadUrl = async (key, contentType, expiresIn = 60) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    return uploadUrl;
  } catch (error) {
    console.error('Error generating S3 presigned URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Generate a presigned URL for downloading a file from S3
 * @param {string} key - The file key (path in S3 bucket)
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
const generateDownloadUrl = async (key, expiresIn = 3600) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: expiresIn
  };

  try {
    const downloadUrl = await s3.getSignedUrlPromise('getObject', params);
    return downloadUrl;
  } catch (error) {
    console.error('Error generating S3 download URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Delete a file from S3 bucket
 * @param {string} key - The file key (path in S3 bucket)
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * List files in a directory in the S3 bucket
 * @param {string} prefix - The directory prefix
 * @returns {Promise<Array>} - Array of file information
 */
const listFiles = async (prefix) => {
  const params = {
    Bucket: bucketName,
    Prefix: prefix
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified
    }));
  } catch (error) {
    console.error('Error listing files from S3:', error);
    throw new Error('Failed to list files');
  }
};

module.exports = {
  s3,
  bucketName,
  generateUploadUrl,
  generateDownloadUrl,
  deleteFile,
  listFiles
};
