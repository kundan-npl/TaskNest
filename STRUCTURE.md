# TaskNest Project Structure

This document outlines the structure of the TaskNest project, identifying permanent files that are essential to the application and temporary files that were created for debugging or testing purposes.

## Directory Overview

The TaskNest project follows a standard full-stack application structure with separate frontend and backend directories:

```
/TaskNest
├── frontend/         # React frontend (Vite + React)
├── backend/          # Express.js backend
├── docs/             # Project documentation
└── [Project Files]   # Project-level configuration and documentation
```

## Permanent vs. Temporary Files

### Permanent Core Project Files

These files are essential parts of the application and should be kept for production:

#### Root Directory
- `PROJECT-BLUEPRINT.md` - Project specifications and architecture design
- `README.md` - Main project documentation
- `start-app.sh` - Script to start both frontend and backend

#### Backend Directory (`/backend`)
- `server.js` - Main Express application entry point
- `package.json` - Backend dependencies
- `/src/config/` - Configuration files (database, S3, etc.)
- `/src/controllers/` - API endpoint handlers
  - `auth.controller.js`
  - `project.controller.js`
  - `task.controller.js`
  - `user.controller.js`
  - `file.controller.js`
- `/src/middleware/auth` - Authentication middleware
- `/src/middleware/error` - Error handling middleware
- `/src/models/` - MongoDB schemas
  - `project.model.js`
  - `task.model.js`
  - `user.model.js`
- `/src/routes/` - API route definitions
  - `auth.routes.js`
  - `project.routes.js`
  - `task.routes.js`
  - `user.routes.js`
  - `file.routes.js`
- `/src/services/` - Business logic services
  - `file.service.js`
- `/src/utils/` - Utility functions
  - `constants/` - Application constants

#### Frontend Directory (`/frontend`)
- `index.html` - Root HTML file
- `package.json` - Frontend dependencies
- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.env` - Environment variables (template version should be versioned)
- `/public/` - Static assets
- `/src/App.jsx` - Main application component
- `/src/main.jsx` - Application entry point
- `/src/assets/` - Static resources
- `/src/components/` - Reusable React components
  - `/common/` - Shared components
    - `ProtectedRoute.jsx`
    - `RoleBasedRoute.jsx`
    - `FileUploader.jsx`
    - `ErrorBoundary.jsx`
  - `/layout/` - Layout components
    - `AuthLayout.jsx`
    - `Layout.jsx`
    - `Header.jsx`
    - `Sidebar.jsx`
  - `/charts/` - Chart components
- `/src/context/` - React context providers
  - `AuthContext.jsx`
- `/src/pages/` - Page components
  - `/auth/` - Authentication pages
    - `Login.jsx`
    - `Register.jsx`
    - `ForgotPassword.jsx`
    - `ResetPassword.jsx`
  - `/dashboard/` - Dashboard
    - `Dashboard.jsx`
  - `/projects/` - Project management pages
  - `/tasks/` - Task management pages
  - `/profile/` - User profile pages
  - `/settings/` - Settings pages
- `/src/services/` - API service calls
  - `authService.js`
  - `fileService.js`
  - `projectService.js`
  - `taskService.js`
- `/src/hooks/` - Custom React hooks
- `/src/utils/` - Utility functions

### Temporary Files (For Development/Debugging)

These files were created for debugging and testing and can be removed before production deployment:

#### Root Directory
- `STRUCTURE.md` - This document (can be kept as reference but not essential)
- `run-test.sh` - Test runner script for S3 integration
- `test-file.txt` - Temporary test file for S3 uploads
- `test-s3-integration.js` - S3 integration test script
- `TESTING.md` - Testing documentation specifically for S3 integration
- `PROJECT-PROGRESS.md` - Development progress tracking (can be archived)
- `cleanup.sh` - The cleanup script itself (can be kept for future maintenance)
- `start-dev.sh` - Development startup script (keep only production startup scripts)

#### Backend Directory (`/backend`)
- `__tests__/` - Empty test directory (can be removed or populated with actual tests)
- `/src/controllers/debug.controller.js` - Debug endpoints for troubleshooting (REMOVE before production)
- `/src/routes/debug.routes.js` - Debug routes for API testing (REMOVE before production)
- `/src/routes/mock-s3.routes.js` - Mock S3 routes for testing without AWS (REMOVE before production)
- `/src/utils/mockedS3.js` - Mock S3 implementation for local testing (REMOVE before production)
- `/src/utils/seedData.js` - Database seeding script for test data (REMOVE before production)

#### Frontend Directory (`/frontend`)
- `TODO.md` - Development todo list with frontend tasks
- `__tests__/` - Empty test directory (can be removed or populated with actual tests)
- `/src/pages/auth/PublicLogin.jsx` - Emergency login page for debugging (REMOVE before production)
- `/src/pages/settings/ApiCheck.jsx` - API connectivity test page (REMOVE before production)
- `/src/pages/settings/FileUploadTest.jsx` - File upload test page for S3 testing (REMOVE before production)
- `/src/utils/debug.js` - Debug utilities added to window object (REMOVE before production)

#### Documentation
- `/docs/S3_INTEGRATION.md` - Technical documentation for S3 integration (consider keeping for reference or moving to internal wiki)

## Development vs. Production Environment

### For Development
- Keep all files, including temporary and testing files
- Use environment variables with development values
- Mock services where appropriate (like S3)

### For Production
1. Remove all files marked as temporary
2. Update environment variables for production
3. Disable debug endpoints and routes
4. Remove console.log statements and debugging code
5. Enable proper error handling and logging

## File Cleanup Checklist Before Deployment

- [ ] Remove debug controller and routes:
  - [ ] `/backend/src/controllers/debug.controller.js`
  - [ ] `/backend/src/routes/debug.routes.js`
  - [ ] Remove debug route imports and usage in `/backend/server.js`

- [ ] Remove mock S3 implementation:
  - [ ] `/backend/src/routes/mock-s3.routes.js`
  - [ ] `/backend/src/utils/mockedS3.js`
  - [ ] Remove mock S3 imports and usage in `/backend/server.js`

- [ ] Remove test and debugging files from root directory:
  - [ ] `/test-file.txt`
  - [ ] `/test-s3-integration.js`
  - [ ] `/TESTING.md`
  - [ ] `/run-test.sh` (if not needed for CI/CD)

- [ ] Remove frontend debugging components:
  - [ ] `/frontend/src/pages/auth/PublicLogin.jsx`
  - [ ] `/frontend/src/pages/settings/ApiCheck.jsx`
  - [ ] `/frontend/src/pages/settings/FileUploadTest.jsx`
  - [ ] `/frontend/src/utils/debug.js`
  - [ ] Remove debug imports and routes in `/frontend/src/App.jsx`
  - [ ] Remove debug imports in `/frontend/src/main.jsx`

- [ ] Clean up temporary frontend files:
  - [ ] `/frontend/TODO.md`
  - [ ] Empty or development-only directories (if not needed)

- [ ] Remove database seed scripts:
  - [ ] `/backend/src/utils/seedData.js`

- [ ] Clean up development cruft:
  - [ ] Remove console.log statements throughout the codebase
  - [ ] Remove commented out code
  - [ ] Fix any TODOS or FIXMEs in comments

- [ ] Environment and production setup:
  - [ ] Update environment variables for production
  - [ ] Ensure proper error handling is in place
  - [ ] Set appropriate logging levels
  - [ ] Check for hardcoded development URLs or credentials

- [ ] Documentation updates:
  - [ ] Move `/docs/S3_INTEGRATION.md` to internal wiki or keep for reference
  - [ ] Archive `/PROJECT-PROGRESS.md` for historical reference

You can use the provided `cleanup.sh` script to automate many of these tasks.

## Future Development Guidelines

When continuing development of this project:

1. **Follow the existing architecture** as defined in PROJECT-BLUEPRINT.md
2. **Avoid creating temporary files** in the main codebase; use a separate development branch instead
3. **Use the existing component structure** and naming conventions
4. **Create reusable components** rather than one-off solutions
5. **Update documentation** when making significant architectural changes
6. **Maintain separation of concerns** between frontend and backend
7. **Keep API interfaces consistent** with the established patterns

## Development Prompt for Future Work

When you need to continue working on this project with another AI assistant, use the following prompt:

```
I'm working on a project called TaskNest, which is a project management application with the following structure:

1. Frontend: React with Vite, TailwindCSS, and JWT authentication
2. Backend: Express.js with MongoDB using Mongoose
3. File Storage: AWS S3 integration

The project follows a specific architecture defined in PROJECT-BLUEPRINT.md, with separate frontend and backend directories.

Key features include:
- Role-based access control (admin, manager, team member)
- Project and task management
- File uploads and attachments
- Data visualization with charts

Please help me [SPECIFIC TASK], following these guidelines:
- Follow the existing architecture and component structure
- Avoid creating temporary debugging files in the main codebase
- Maintain clear separation of concerns
- Create reusable components following the project's patterns
- Focus on clean, efficient code that aligns with the blueprint

The most important files to understand are:
1. PROJECT-BLUEPRINT.md - Overall architecture
2. backend/src/models/ - Database schemas
3. frontend/src/context/AuthContext.jsx - Authentication system
4. frontend/src/services/ - API integration services
```

Replace `[SPECIFIC TASK]` with the particular feature or bug you need help with.
