import React from 'react';
import { 
  Squares2X2Icon, 
  ListBulletIcon, 
  TableCellsIcon,
  ArrowsUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

const TaskViewControls = ({ 
  view, 
  onViewChange, 
  sortBy, 
  onSortByChange, 
  sortOrder, 
  onSortOrderChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onBulkAction 
}) => {
  const viewOptions = [
    { id: 'list', label: 'List', icon: ListBulletIcon },
    { id: 'board', label: 'Board', icon: Squares2X2Icon },
    { id: 'compact', label: 'Compact', icon: TableCellsIcon }
  ];

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'created', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'project', label: 'Project' }
  ];

  const bulkActions = [
    { id: 'in-progress', label: 'Mark In Progress', color: 'blue' },
    { id: 'review', label: 'Mark for Review', color: 'orange' },
    { id: 'completed', label: 'Mark Completed', color: 'green' },
    { id: 'on-hold', label: 'Put On Hold', color: 'yellow' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      {/* Main Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        {/* Left side - View Controls and Sorting */}
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            {viewOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => onViewChange(option.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    view === option.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Right side - Task Count and Selection */}
        <div className="flex items-center gap-4">
          {/* Task Count */}
          <div className="text-sm text-gray-600">
            {selectedCount > 0 ? (
              <span className="font-medium text-blue-600">
                {selectedCount} of {totalCount} selected
              </span>
            ) : (
              <span>Tasks ({totalCount})</span>
            )}
          </div>

          {/* Selection Controls */}
          {totalCount > 0 && (
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {selectedCount === totalCount && totalCount > 0 ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm font-medium text-blue-900">
              {selectedCount} task{selectedCount > 1 ? 's' : ''} selected
            </div>
            <div className="flex flex-wrap gap-2">
              {bulkActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => onBulkAction(action.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    action.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    action.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                    action.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    action.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                    'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {action.label}
                </button>
              ))}
              <button
                onClick={() => onBulkAction('clear')}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskViewControls;
