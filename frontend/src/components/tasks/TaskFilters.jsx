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
      { value: 'high', label: 'High', color: 'red' },
      { value: 'medium', label: 'Medium', color: 'yellow' },
      { value: 'low', label: 'Low', color: 'green' }
    ],
    dueDate: [
      { value: 'overdue', label: 'Overdue', color: 'red' },
      { value: 'today', label: 'Today', color: 'orange' },
      { value: 'week', label: 'This Week', color: 'blue' },
      { value: 'month', label: 'This Month', color: 'purple' }
    ]
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      {/* Compact Single Row Layout */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filters Label */}
        <div className="flex items-center gap-2 shrink-0">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </div>

        {/* Search Filter */}
        <div className="relative min-w-64">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white min-w-28"
        >
          <option value="">All Status</option>
          {filterOptions.status.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white min-w-24"
        >
          <option value="">All Priority</option>
          {filterOptions.priority.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Due Date Filter */}
        <select
          value={filters.dueDate}
          onChange={(e) => onFilterChange('dueDate', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white min-w-32"
        >
          <option value="">Any Due Date</option>
          {filterOptions.dueDate.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Project Filter */}
        {projects.length > 0 && (
          <select
            value={filters.project}
            onChange={(e) => onFilterChange('project', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white min-w-32"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}

        {/* Show Completed Toggle */}
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => onShowCompletedChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm text-gray-700">Show completed tasks</span>
        </label>

        {/* View Controls in same line */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium text-gray-700">View:</span>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskFilters;
