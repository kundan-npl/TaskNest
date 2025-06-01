import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, getProgressPercentage, getTimeLeft } from '../../../utils/projectHelpers';

const ProjectOverviewWidget = ({ 
  project, 
  tasks = [], 
  userRole, 
  permissions = {}, 
  onUpdate,
  className = '' 
}) => {
  if (!project) return null;

  const progress = project.progress || getProgressPercentage(tasks);
  const timeLeft = getTimeLeft(project.deadline);

  return (
    <div className={`widget-card ${className}`}>
      <div className="widget-header">
        <h2 className="widget-title">Project Overview</h2>
        {permissions.canEdit && (
          <Link
            to={`/projects/${project._id || project.id}/edit`}
            className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Edit
          </Link>
        )}
      </div>
      
      <div className="widget-content">
        <div className="space-y-6">
          {/* Project Title and Status */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {project.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {project.description}
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              project.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
              project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
              {project.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              project.priorityLevel === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
              project.priorityLevel === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {project.priorityLevel} priority
            </span>
          </div>

          {/* Project Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {tasks.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.members?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Team Members</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(project.startDate)}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Deadline:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(project.deadline)}
              </div>
            </div>
          </div>

          {/* Time remaining */}
          {project.deadline && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ⏰ {timeLeft}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectOverviewWidget;
