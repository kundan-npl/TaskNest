import React from 'react';
import EnhancedTaskCard from './EnhancedTaskCard';

const TaskList = ({ 
  tasks, 
  selectedTasks, 
  onTaskSelection,
  variant = 'default' // 'default', 'compact'
}) => {
  const allSelected = tasks.length > 0 && selectedTasks.size === tasks.length;
  const someSelected = selectedTasks.size > 0 && selectedTasks.size < tasks.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={input => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={() => {
                // Handle select all functionality
                if (allSelected) {
                  // Deselect all
                  tasks.forEach(task => {
                    if (selectedTasks.has(task.id)) {
                      onTaskSelection(task.id);
                    }
                  });
                } else {
                  // Select all
                  tasks.forEach(task => {
                    if (!selectedTasks.has(task.id)) {
                      onTaskSelection(task.id);
                    }
                  });
                }
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <h3 className="font-semibold text-gray-900">
              Tasks ({tasks.length})
            </h3>
          </div>
          {selectedTasks.size > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {selectedTasks.size} selected
            </span>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-gray-200">
        {tasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">No tasks match your current filters.</p>
            </div>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div 
              key={task.id} 
              className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                index === tasks.length - 1 ? '' : 'border-b border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={() => onTaskSelection(task.id)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex-1">
                  <EnhancedTaskCard
                    task={task}
                    variant={variant}
                    showProject={true}
                    showAssignee={true}
                    showDueDate={true}
                    showSubtasks={variant === 'default'}
                    showTags={variant === 'default'}
                    className="border-0 shadow-none p-0 bg-transparent hover:shadow-none"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
