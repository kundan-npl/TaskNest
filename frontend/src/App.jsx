import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

// Import enhanced dark theme styles
import './assets/styles/dark-theme.css';

// Layout components
import Layout from './components/layout/Layout.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';

// Auth pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import UserManagement from './pages/users/UserManagement.jsx';

// Main pages
import Dashboard from './pages/dashboard/Dashboard.jsx';
import ProjectsList from './pages/projects/ProjectsList.jsx';
import ProjectDetails from './pages/projects/ProjectDetails.jsx';
import CreateProject from './pages/projects/CreateProject.jsx';
import EditProject from './pages/projects/EditProject.jsx';
import TaskDetails from './pages/tasks/TaskDetails.jsx';
import CreateTask from './pages/tasks/CreateTask.jsx';
import TaskCalendar from './pages/tasks/TaskCalendar.jsx';
import UserProfile from './pages/profile/UserProfile.jsx';
import Settings from './pages/settings/Settings.jsx';

// Testing pages
// Widget integration test removed during cleanup

// Protected route component
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import RoleBasedRoute from './components/common/RoleBasedRoute.jsx';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resettoken" element={<ResetPassword />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          
          {/* Projects */}
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route 
            path="/projects/create" 
            element={
              <RoleBasedRoute allowedRoles={['admin', 'user']}>
                <CreateProject />
              </RoleBasedRoute>
            } 
          />
          <Route 
            path="/projects/:id/edit" 
            element={
              <RoleBasedRoute allowedRoles={['admin', 'user']}>
                <EditProject />
              </RoleBasedRoute>
            } 
          />
          
          {/* Tasks */}
          <Route path="/tasks/:id" element={<TaskDetails />} />
          <Route path="/projects/:projectId/tasks/create" element={<CreateTask />} />
          <Route path="/tasks/calendar" element={<TaskCalendar />} />
          
          {/* User Management */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route 
            path="/users" 
            element={
              <RoleBasedRoute allowedRoles={['admin']}>
                <UserManagement />
              </RoleBasedRoute>
            } 
          />
          
          {/* Testing Routes - Only for development */}
          {/* Widget test route removed during cleanup */}
        </Route>

        {/* Default route redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
