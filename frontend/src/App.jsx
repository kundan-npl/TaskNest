import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

// Import enhanced dark theme styles
import './assets/styles/dark-theme.css';

// Layout components
import Layout from './components/layout/Layout.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';

// Auth pages (keep these loaded since they're small and often needed)
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import AcceptInvitation from './pages/auth/AcceptInvitation.jsx';
import EmailSent from './pages/auth/EmailSent.jsx';

// Protected route component
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import RoleBasedRoute from './components/common/RoleBasedRoute.jsx';

// Lazy load heavy components
const Home = lazy(() => import('./pages/Home.jsx'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard.jsx'));
const ProjectsList = lazy(() => import('./pages/projects/ProjectsList.jsx'));
const ProjectDetails = lazy(() => import('./pages/projects/ProjectDetails.jsx'));
const CreateProject = lazy(() => import('./pages/projects/CreateProject.jsx'));
const EditProject = lazy(() => import('./pages/projects/EditProject.jsx'));
const TaskDetails = lazy(() => import('./pages/tasks/TaskDetails.jsx'));
const CreateTask = lazy(() => import('./pages/tasks/CreateTask.jsx'));
const EditTask = lazy(() => import('./pages/tasks/EditTask.jsx'));
const TaskCalendar = lazy(() => import('./pages/tasks/TaskCalendar.jsx'));
const MyTasks = lazy(() => import('./pages/tasks/MyTasks.jsx'));
const UserProfile = lazy(() => import('./pages/profile/UserProfile.jsx'));
const Settings = lazy(() => import('./pages/settings/Settings.jsx'));
const UserManagement = lazy(() => import('./pages/users/UserManagement.jsx'));

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
  </div>
);

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

  // Add this helper component inside App
  function ResetPasswordWithQuery() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    // Render ResetPassword with the token as a prop
    return <ResetPassword resettoken={token} />;
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          {/* Public Home Route */}
          <Route path="/home" element={<Home />} />
          
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/email-sent" element={<EmailSent />} />
            <Route path="/auth/reset-password/:resettoken" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPasswordWithQuery />} />
          </Route>

          {/* Public invitation acceptance route */}
          <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
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
          <Route path="/tasks" element={<MyTasks />} />
          <Route path="/tasks/:id" element={<TaskDetails />} />
          <Route path="/tasks/:id/edit" element={<EditTask />} />
          <Route path="/tasks/create" element={<CreateTask />} />
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
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      </Suspense>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
