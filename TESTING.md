# Testing the TaskNest S3 Integration

This document provides step-by-step instructions for testing the AWS S3 integration for TaskNest.

## Prerequisites

1. MongoDB installed and running locally (or access to MongoDB Atlas)
2. Node.js and npm installed
3. AWS account with S3 access configured

## Setup Steps

### 1. Configure Environment Variables

Backend:
```bash
cd /Users/kundan/PROJECTS/TaskNest/backend
cp .env.example .env
# Edit .env and add your AWS credentials
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd /Users/kundan/PROJECTS/TaskNest/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Initialize the Database

Make sure you have MongoDB running locally or have configured the MongoDB Atlas connection in the `.env` file.

### 4. Start the Backend Server

```bash
cd /Users/kundan/PROJECTS/TaskNest/backend
npm run dev
```

### 5. Start the Frontend Development Server

```bash
cd /Users/kundan/PROJECTS/TaskNest/frontend
npm run dev
```

## Testing the S3 Integration

### Method 1: Using the UI

1. Open the browser and navigate to `http://localhost:3000`
2. Login with admin credentials
3. Go to `/file-test` page (File Upload Test link in the sidebar)
4. Upload a test file and verify the functionality

### Method 2: Using the Test Script

```bash
cd /Users/kundan/PROJECTS/TaskNest
node test-s3-integration.js
```

The test script will:
1. Login to get an authentication token
2. Get a presigned URL for file upload
3. Upload a test file to S3
4. Save the file metadata
5. List the uploaded files
6. Get a download URL for the file
7. Delete the file

## Troubleshooting

If you encounter errors:

1. **MongoDB connection issues**: Check that MongoDB is running
2. **AWS S3 errors**: Verify your AWS credentials and permissions
3. **JWT errors**: The default JWT secret in the .env file should work for testing

## Manual Test Procedure

To manually test each component:

1. **Backend S3 Setup**
   ```
   curl -X POST http://localhost:5500/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "password123"}'
   ```

2. **Get Upload URL**
   ```
   curl -X POST http://localhost:5500/api/v1/files/upload-url \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"filename": "test.txt", "contentType": "text/plain"}'
   ```

3. **Upload Using Presigned URL**
   ```
   curl -X PUT "PRESIGNED_URL" \
     -H "Content-Type: text/plain" \
     --data-binary "@test.txt"
   ```

For full test procedures, refer to the `docs/S3_INTEGRATION.md` documentation.









Here's a step-by-step plan to clean up the TaskNest project:

Step 1: Identify duplicate files (JS/JSX pairs)
I'll identify all cases where there are both .js and .jsx versions of the same file, check if they contain identical content, and determine which one is actually being imported.

Step 2: Fix the AuthContext issues
Since the error is specifically related to AuthContext, let's focus on solving that problem first.

Step 3: Clean up debug files
Based on STRUCTURE.md, identify and remove any debugging files or temporary code.

Step 4: Standardize file extensions
Ensure consistent file extensions (.jsx for React components with JSX, .js for non-JSX files).

Step 5: Fix any broken imports or references
Ensure all imports reference the correct files after our cleanup.