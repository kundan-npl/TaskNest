import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  ClipboardDocumentListIcon,
  FunnelIcon 
} from '@heroicons/react/24/outline';

const TaskEmptyState = ({ 
  hasFilters = false, 
  onClearFilters,
  type = 'no-tasks' // 'no-tasks', 'no-results'
}) => {
  if (type === 'no-results') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FunnelIcon className="mx-auto h-16 w-16 text-gray-400 mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          No tasks match your filters
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Try adjusting your search criteria or clearing some filters to see more tasks.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            Clear All Filters
          </button>
          <Link
            to="/tasks/create"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Create New Task
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-full p-4 inline-block mb-6 shadow-lg">
          <ClipboardDocumentListIcon className="w-16 h-16 text-blue-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Ready to Get Started?
        </h3>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          You don't have any tasks assigned yet. Start by exploring projects 
          or creating your first task to begin organizing your work.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <ClipboardDocumentListIcon className="w-5 h-5" />
            Browse Projects
          </Link>
          
          <Link
            to="/tasks/create"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Create Task
          </Link>
        </div>

        {/* Quick Tips */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">
            Quick Tips to Get Started
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 text-sm">Join a Project</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    Browse existing projects and request to join teams
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 text-sm">Create Tasks</h5>
                  <p className="text-xs text-gray-600 mt-1">
                    Start a new project and create your first tasks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskEmptyState;
