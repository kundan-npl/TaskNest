# TaskNest - Project Summary

## Overview

TaskNest is a full-stack project management application built with a React frontend and Express.js backend. It aims to provide teams with a simple yet powerful tool to manage projects, tasks, and collaboration.

## Current Status

The project is in active development with core features being implemented. The authentication system and basic project/task management functionality are partially complete. The frontend interface is in progress, with several key components and pages implemented.

## Key Features (Based on Blueprint)

1. **Role-Based Access Control**
   - Admin, Manager, and Team Member roles
   - JWT-based authentication
   - Protected routes based on user roles

2. **Project and Task Management**
   - Projects with title, description, deadline, priority, tags
   - Tasks with title, description, status, assignee, due date
   - Subtasks and task dependencies

3. **User Interface**
   - Dashboard with overview of tasks and projects
   - Project and task views
   - Profile and settings pages

4. **File Sharing & Storage**
   - AWS S3 integration for file uploads
   - Attach files to projects and tasks

5. **Data Visualization**
   - Charts for task status and progress

## Technical Architecture

### Backend
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **File Storage**: AWS S3

### Frontend
- **Framework**: React with Vite
- **Styling**: TailwindCSS
- **State Management**: React Context API
- **Routing**: React Router
- **Charts**: Chart.js

## Project Structure

The project follows a standard full-stack application structure:

- `/frontend`: React application
- `/backend`: Express.js API
- `/docs`: Documentation files

For a detailed breakdown of all files and their purpose (permanent vs. temporary), see `STRUCTURE.md`.

## Development Status and Issues

### Completed
- Backend API structure
- Authentication system
- Basic project and task models and APIs
- Frontend routing and layout components
- JWT authentication flow

### In Progress
- Frontend UI components
- Project and task management pages
- File upload functionality
- Data visualization

### Outstanding Issues
- API connectivity issues between frontend and backend
- Authentication flow needs improvement
- S3 integration requires further work
- Error handling needs enhancement

## Future Development

See `PROJECT-BLUEPRINT.md` for the complete roadmap. Key upcoming features include:

1. Completing the dashboard with visualization
2. Enhancing project and task management functionality
3. Adding comments and collaboration features
4. Improving file management
5. Adding notifications system

## Documents Guide

- **PROJECT-BLUEPRINT.md**: Comprehensive project specifications and architecture
- **STRUCTURE.md**: Detailed breakdown of all files (permanent vs. temporary)
- **DEVELOPMENT-GUIDELINES.md**: Best practices for ongoing development
- **README.md**: General project information

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Create environment files:
   - Backend: `.env` with MongoDB connection, JWT secret, etc.
   - Frontend: `.env` with API URL
   
4. Start development servers:
   ```
   ./start-dev.sh
   ```
   
## Cleanup Before Production

Use the `cleanup.sh` script to remove all temporary files and debugging code before deploying to production.
