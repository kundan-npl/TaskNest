import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import AdminAnalytics from '../../components/admin/AdminAnalytics.jsx';

const Reports = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Comprehensive system analytics and reporting dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Admin Access
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AdminAnalytics />

      {/* Additional Reports Section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Report Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Full Report
          </button>
          <button className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Report
          </button>
          <button className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Report Settings
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Environment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Application Version:</span>
                <span className="text-gray-900 dark:text-white font-medium">v2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Environment:</span>
                <span className="text-gray-900 dark:text-white font-medium">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Backup:</span>
                <span className="text-gray-900 dark:text-white font-medium">2024-01-15 03:00 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Database Status:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Healthy</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Current User</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="text-gray-900 dark:text-white font-medium">{currentUser?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <span className="text-gray-900 dark:text-white font-medium capitalize">{currentUser?.systemRole || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Login:</span>
                <span className="text-gray-900 dark:text-white font-medium">Today, 2:30 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Session Status:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
