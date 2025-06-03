import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  PlayIcon, 
  PauseIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const TaskStatsDashboard = ({ stats, className = '' }) => {
  const statCards = [
    {
      id: 'total',
      label: 'Total Tasks',
      value: stats.total,
      icon: ChartBarIcon,
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      iconColor: 'text-gray-500'
    },
    {
      id: 'inProgress',
      label: 'In Progress',
      value: stats.inProgress,
      icon: PlayIcon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500'
    },
    {
      id: 'completed',
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconColor: 'text-green-500'
    },
    {
      id: 'notStarted',
      label: 'Not Started',
      value: stats.notStarted,
      icon: ClockIcon,
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      iconColor: 'text-gray-400'
    },
    {
      id: 'onHold',
      label: 'On Hold',
      value: stats.onHold,
      icon: PauseIcon,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      iconColor: 'text-yellow-500'
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: stats.overdue,
      icon: ExclamationTriangleIcon,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconColor: 'text-red-500'
    }
  ];

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className={`mb-8 ${className}`}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={stat.id}
              className={`${stat.bgColor} rounded-xl p-4 border border-opacity-20 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {stat.label}
                  </p>
                </div>
                <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Task Progress Overview
            </h3>
            <p className="text-sm text-gray-600">
              {completionRate}% of tasks completed • {stats.inProgress} in progress
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">{stats.inProgress}</p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">{stats.completed}</p>
            <p className="text-sm text-gray-600">Done</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-red-600">{stats.overdue}</p>
            <p className="text-sm text-gray-600">Overdue</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-yellow-600">{stats.onHold}</p>
            <p className="text-sm text-gray-600">On Hold</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskStatsDashboard;
