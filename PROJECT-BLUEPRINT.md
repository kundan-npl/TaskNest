# TaskNest - Project Blueprint

## Project Overview

**Project Title**: TaskNest - A Simple and Smart Project Management Tool

**Project Objective**:
TaskNest is a project management platform designed to help teams and individuals manage their work efficiently. It focuses on providing a clean and minimal user experience, enabling real-time collaboration, and supporting essential project tracking and team management features. The goal is to create a tool that is simple to use yet powerful enough for effective task and project handling.

## Key Features

### 1. Role-Based Access Control (RBAC)

**Roles**:
- **Admin**: Full access including user and role management.
- **Manager**: Project creation, task assignment, limited user management.
- **Team Member**: Task view and update permissions only.

**Implementation**:
- JWT-based authentication system
- Role assignment upon registration or by admin
- Middleware on backend to authorize route access based on role

### 2. Project and Task Management

**Project Attributes**:
- Title, Description, Deadline, Priority Level, Tags

**Task Attributes**:
- Title, Description, Status (To-Do, In Progress, Done), Assignee, Due Date, Subtasks

**Functionality**:
- Create/update/delete/view projects and tasks
- Add subtasks and mark task dependencies
- Support for file attachments per task

### 3. Simple and Intuitive UI

**Pages**:
- **Dashboard**: Overview of all tasks and projects
- **Projects**: Detailed view of each project and associated tasks
- **Task View**: Subtasks, attachments, comments
- **Profile/Settings**: Change user data and preferences

**Design System**:
- Built using React JSX
- TailwindCSS for clean and responsive styling

### 4. Charts and Progress Visualization

**Charts Included**:
- Pie chart showing task status distribution
- Bar chart of weekly task completion
- (Future) Gantt chart for timeline visualization

**Library**:
- Chart.js for visualization

### 5. File Sharing & Resource Uploads

- Attach images, PDFs, or documents to each task or comment
- Uploads stored on AWS S3 bucket
- Backend generates signed upload URLs
- Frontend handles upload and preview

## Tech Stack

| Layer    | Tech Used                                 |
| -------- | ----------------------------------------- |
| Frontend | React JSX, Vite, Tailwind CSS             |
| Backend  | Express.js, Node.js                       |
| Database | MongoDB Atlas                             |
| Auth     | JWT Tokens, Social Login (OAuth)          |
| Storage  | AWS S3                                    |
| Charts   | Chart.js                                  |
| Hosting  | Vercel (frontend), AWS (backend)          |

## Project Structure

### Backend Structure

```
backend/
│
├── src/
│   ├── config/            # Configuration files (DB, AWS, etc.)
│   ├── controllers/       # Request handlers
│   ├── models/            # MongoDB schema definitions
│   ├── routes/            # API route definitions
│   ├── middleware/        # Custom middleware
│   │   ├── auth/          # Authentication middleware
│   │   ├── validation/    # Request validation
│   │   └── error/         # Error handling
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
│       └── constants/     # Application constants
│
├── __tests__/            # Test files
├── .env.example          # Example environment variables
└── package.json          # Project dependencies
```

### Frontend Structure

```
frontend/
│
├── public/               # Static files
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Reusable components
│   │   ├── layout/       # Layout components
│   │   ├── forms/        # Form components
│   │   ├── charts/       # Visualization components
│   │   └── modals/       # Modal components
│   │
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── projects/     # Project management pages
│   │   ├── tasks/        # Task management pages
│   │   ├── profile/      # User profile pages
│   │   └── settings/     # Settings pages
│   │
│   ├── services/         # API service calls
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── context/          # React context providers
│   ├── store/            # State management
│   └── assets/           # Static assets
│       ├── images/       # Image files
│       ├── styles/       # CSS files
│       └── icons/        # Icon files
│
├── __tests__/           # Test files
└── package.json         # Project dependencies
```

### Root Structure

```
/
├── backend/             # Backend code
├── frontend/            # Frontend code
├── .github/             # GitHub workflows and templates
├── docs/                # Documentation
├── PROJECT-BLUEPRINT.md # This file
└── PROJECT-PROGRESS.md  # Progress tracking
```

## Development Roadmap

### Phase 1: Planning & Design (Week 1)
- Define user roles and access
- Finalize UI wireframes using Figma
- Prepare component tree for frontend
- Design MongoDB schema for users, projects, tasks

### Phase 2: Authentication & User System (Week 2)
- Implement JWT auth with login/register APIs
- Integrate user roles and permissions
- Basic UI for login, register, and dashboard setup

### Phase 3: Core Project & Task Modules (Week 3)
- Backend: CRUD APIs for Projects and Tasks
- Frontend: Project view and task assignment UIs
- File upload using AWS S3

### Phase 4: Visualization & Dashboard (Week 4)
- Implement chart components using Chart.js
- Show project summary on dashboard
- Integrate filters by status, assignee, or deadline

### Phase 5: Collaboration Features (Week 5)
- Add comment section under tasks
- Display project activity logs
- Optional: Add Socket.IO for live task updates

### Phase 6: Hosting & MVP Testing (Week 6)
- Deploy backend on AWS EC2 or Render
- Deploy frontend on Vercel
- Connect MongoDB Atlas
- Perform manual and basic automated testing

## Current Focus

For now, the focus is on building:
- Role-based user system
- Basic project and task modules
- File upload and storage
- Charts for task progress
- Clean and simple UI

## Future Enhancements (Post-MVP)

- Time tracking and reporting
- Gantt charts for project timelines
- Notifications and reminders
- Email integration (convert emails into tasks)
- AI features like task summary and prediction
- Full audit logs
- Admin analytics dashboard

## Security Considerations

- All sensitive information (API keys, connection strings) stored in environment variables
- Input validation on all API endpoints
- XSS protection
- CORS configuration
- Rate limiting for API endpoints
- Regular security audits

## Centralized Sensitive Content Management

1. **Environment Variables**:
   - All secrets and configuration values stored in `.env` files (not committed to repo)
   - `.env.example` files provided as templates

2. **Configuration Files**:
   - Backend: `src/config` directory contains all configuration settings
   - Frontend: Environment-specific configuration handled through build process

3. **API Keys and Secrets**:
   - Managed through environment variables
   - Different values for development/staging/production environments
