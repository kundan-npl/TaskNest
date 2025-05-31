// AWS S3 Configuration
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Initialize S3 client
let s3ClientConfig = {
  region: process.env.AWS_REGION || 'us-east-1'
};

// Add credentials if provided
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

// Use a local S3 endpoint if in development/test mode and endpoint is specified
if (process.env.NODE_ENV !== 'production' && process.env.AWS_S3_ENDPOINT) {
  s3ClientConfig.endpoint = process.env.AWS_S3_ENDPOINT;
  s3ClientConfig.forcePathStyle = true;
}

// For local testing without actual AWS credentials
if (process.env.NODE_ENV === 'test' || process.env.MOCK_S3 === 'true') {
  console.log('Using mock S3 implementation for testing');
  s3ClientConfig.endpoint = 'http://localhost:4566'; // LocalStack default endpoint
  s3ClientConfig.forcePathStyle = true;
  s3ClientConfig.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  };
}

const s3Client = new S3Client(s3ClientConfig);

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
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
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
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  try {
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });
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
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  try {
    await s3Client.send(command);
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
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix
  });

  try {
    const data = await s3Client.send(command);
    return (data.Contents || []).map(item => ({
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
  s3Client,
  bucketName,
  generateUploadUrl,
  generateDownloadUrl,
  deleteFile,
  listFiles
};
