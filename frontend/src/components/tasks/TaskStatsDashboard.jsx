import React from 'react';

const TaskStatsDashboard = ({ stats, className = '' }) => {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  
  // Validate that status counts add up (include review status)
  const statusSum = stats.completed + stats.inProgress + stats.notStarted + (stats.review || 0) + stats.onHold;
  const hasValidCounts = statusSum === stats.total;

  return (
    <div className={`mb-8 ${className}`}>
      {/* Task Progress Overview - Consolidated Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Task Progress Overview
          </h3>
          <p className="text-sm text-gray-600">
            Status breakdown and completion progress. Note: Tasks can be overdue regardless of their current status.
          </p>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold text-gray-700">{stats.total}</p>
            <p className="text-xs text-gray-600">Total Tasks</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold text-gray-600">{stats.notStarted}</p>
            <p className="text-xs text-gray-600">Not Started</p>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <p className="text-xl font-bold text-orange-600">{stats.review || 0}</p>
            <p className="text-xs text-gray-600">In Review</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-lg">
            <p className="text-xl font-bold text-yellow-600">{stats.onHold}</p>
            <p className="text-xs text-gray-600">On Hold</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-xs text-gray-600">Overdue</p>
          </div>
        </div>

        {/* Progress Bar Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span className="font-medium">Overall Progress</span>
            <span className="font-semibold">
              {stats.completed} of {stats.total} completed ({completionRate}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          {stats.total > 0 && (
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>{completionRate}% Complete</span>
              <span>100%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskStatsDashboard;
