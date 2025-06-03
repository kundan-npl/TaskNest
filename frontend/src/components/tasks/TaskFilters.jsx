import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TaskFilters = ({ 
  filters, 
  onFilterChange, 
  onResetFilters, 
  projects, 
  showCompleted, 
  onShowCompletedChange,
  hasActiveFilters 
}) => {
  const filterOptions = {
    status: [
      { value: 'not-started', label: 'Not Started', color: 'gray' },
      { value: 'in-progress', label: 'In Progress', color: 'blue' },
      { value: 'on-hold', label: 'On Hold', color: 'yellow' },
      { value: 'completed', label: 'Completed', color: 'green' }
    ],
    priority: [
      { value: 'high', label: 'High Priority', color: 'red' },
      { value: 'medium', label: 'Medium Priority', color: 'yellow' },
      { value: 'low', label: 'Low Priority', color: 'green' }
    ],
    dueDate: [
      { value: 'overdue', label: 'Overdue', color: 'red' },
      { value: 'today', label: 'Due Today', color: 'orange' },
      { value: 'week', label: 'Due This Week', color: 'blue' },
      { value: 'month', label: 'Due This Month', color: 'purple' }
    ]
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Search Filter */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Tasks
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">All Status</option>
            {filterOptions.status.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">All Priority</option>
            {filterOptions.priority.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <select
            value={filters.dueDate}
            onChange={(e) => onFilterChange('dueDate', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">Any Due Date</option>
            {filterOptions.dueDate.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Filter - Full Width */}
      {projects.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            value={filters.project}
            onChange={(e) => onFilterChange('project', e.target.value)}
            className="w-full max-w-md px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Show Completed Toggle */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => onShowCompletedChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Show completed tasks
          </span>
        </label>
      </div>
    </div>
  );
};

export default TaskFilters;
