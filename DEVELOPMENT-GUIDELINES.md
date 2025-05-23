# TaskNest Development Guidelines

This document outlines best practices for ongoing development of the TaskNest project to ensure code quality, maintainability, and adherence to the project architecture.

## Project Architecture

TaskNest follows a clearly defined architecture as outlined in `PROJECT-BLUEPRINT.md`:

1. **Frontend**: React application built with Vite and TailwindCSS
2. **Backend**: Express.js API with MongoDB using Mongoose
3. **Authentication**: JWT-based authentication with role-based access control
4. **File Storage**: AWS S3 integration for file uploads and storage
5. **Data Visualization**: Chart.js for task and project metrics

## Code Organization Guidelines

### General Guidelines

1. **Follow the established directory structure**
   - Keep related code in appropriate directories
   - Don't create new top-level directories without good reason

2. **Separation of concerns**
   - Backend: Controllers for request handling, services for business logic
   - Frontend: Components for UI, services for API calls, contexts for state management

3. **Feature-based organization**
   - Group related files by feature rather than technical type when appropriate

### Backend Guidelines

1. **API Design**
   - Follow RESTful principles
   - Use consistent naming: `GET /resources`, `POST /resources`, `GET /resources/:id`, etc.
   - Group related endpoints under the same router

2. **Controllers**
   - Each controller should focus on a specific resource
   - Keep controllers thin - move business logic to services
   - Follow the pattern: validate request → call service → format response

3. **Models**
   - Define clear schemas with validation
   - Use appropriate MongoDB indexes for performance
   - Document relationships between models

4. **Middleware**
   - Create reusable middleware for common tasks
   - Keep middleware focused on a single responsibility

### Frontend Guidelines

1. **Component Structure**
   - Create reusable components in `/components`
   - Keep page components in `/pages`
   - Follow naming conventions: PascalCase for components

2. **State Management**
   - Use React Context for global state (like authentication)
   - Use local component state for UI-specific state
   - Prefer hooks over class components

3. **API Integration**
   - Keep API calls in service files
   - Use consistent error handling
   - Handle loading and error states in components

4. **Styling**
   - Use TailwindCSS utility classes
   - Create custom components for repeated UI patterns
   - Follow the existing color scheme and design system

## Avoiding Technical Debt

1. **Don't create temporary files in the main codebase**
   - Use branches for experimental features
   - Create proper test files instead of ad-hoc testing files

2. **Document as you go**
   - Add JSDoc comments to functions and components
   - Update README.md and other documentation when making changes

3. **Write tests**
   - Add tests for new functionality
   - Update tests when changing existing functionality

4. **Refactor regularly**
   - Improve code quality as you work on features
   - Don't duplicate code; extract reusable functions and components

5. **Remove console logs before committing**
   - Use proper logging for backend
   - Don't leave debugging statements in production code

## Development Workflow

1. **Feature Development**
   - Understand requirements from PROJECT-BLUEPRINT.md
   - Design the solution considering both frontend and backend
   - Implement backend first, then frontend
   - Test thoroughly before considering complete

2. **Code Review Guidelines**
   - Ensure code follows the architecture
   - Check for proper error handling
   - Verify proper authorization checks
   - Look for potential performance issues

3. **Deployment Checklist**
   - Remove all debugging code and temporary files
   - Update environment variables for production
   - Run tests to ensure functionality
   - Verify security concerns are addressed

## Resources

For any questions about the project structure or architecture, refer to:

1. **PROJECT-BLUEPRINT.md** - Comprehensive project overview and specifications
2. **STRUCTURE.md** - Detailed breakdown of project files and their purpose
3. **Backend models** - To understand the data structure
4. **Frontend contexts and services** - To understand state management and API integration

## Conclusion

Following these guidelines will help maintain a clean, maintainable codebase for TaskNest as it continues to evolve. The most important principle is to respect the established architecture and patterns, keeping the codebase consistent even as new developers contribute to it.
