import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const AuthLayout = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-card">
        <div className="flex flex-col items-center">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            TaskNest
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            A Simple and Smart Project Management Tool
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
