# TaskNest Project

TaskNest is a simple and smart project management tool designed to help teams and individuals manage their work efficiently. It focuses on providing a clean and minimal user experience, enabling real-time collaboration, and supporting essential project tracking and team management features.

## Features

- **Role-Based Access Control**: Multiple user roles with different permissions
- **Project Management**: Create, update, and track projects
- **Task Management**: Organize tasks with status, priority, and assignments
- **Intuitive UI**: Clean interface with responsive design
- **Charts & Analytics**: Visual representation of project progress
- **File Sharing**: AWS S3 integration for file uploads and management
  - Secure file uploads using presigned URLs
  - File organization by projects and tasks
  - Progress tracking during uploads
  - Support for various file types

## Project Structure

This project follows a modern full-stack architecture with a React frontend and Node.js/Express.js backend.

### Main Application Structure

```
/
├── backend/             # Express.js backend code
│   ├── src/             # Source code
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Express middleware
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
│   └── server.js        # Entry point
├── frontend/            # React frontend code
│   ├── src/             # Source code
│   │   ├── assets/      # Static assets
│   │   ├── components/  # React components
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service clients
│   │   └── utils/       # Utility functions
│   └── public/          # Static files
├── docs/                # Project documentation
├── PROJECT-BLUEPRINT.md # Project blueprint
└── PROJECT-PROGRESS.md  # Project progress
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` for your environment:
   ```
   PORT=8000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=30d
   
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   AWS_S3_BUCKET=your_bucket_name
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file based on .env.example:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Key Features

- Role-based access control (Admin, Manager, Team Member)
- Project and task management with subtasks capability
- Clean and intuitive user interface using React and Tailwind CSS
- Charts and progress visualization with Chart.js
- File sharing and resource uploads using AWS S3

## Documentation

For detailed information about the project structure, development roadmap, and technology choices, refer to:

- [Project Blueprint](PROJECT-BLUEPRINT.md)
- [Project Progress](PROJECT-PROGRESS.md)

## Development

This project uses:

- **Backend**: Express.js, MongoDB, JWT authentication
- **Frontend**: React, Tailwind CSS, Chart.js
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest

## License

This project is licensed under the ISC License.

## Contact

For questions or feedback, please reach out to the project maintainers.

## AWS S3 Setup

For the file upload functionality to work, you'll need to set up an AWS S3 bucket.

1. Create an AWS account if you don't have one already
2. Create a new S3 bucket with the following settings:
   - Block all public access: Enabled
   - Bucket versioning: Optional (recommended for production)
   - Server-side encryption: Enabled
   
3. Create an IAM user with programmatic access and attach the following policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

4. Add the IAM user's access key and secret key to your `.env` file.

For more details on the S3 integration, see [S3 Integration Documentation](docs/S3_INTEGRATION.md).
