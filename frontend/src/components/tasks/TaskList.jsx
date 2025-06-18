import React from 'react';
import CleanTaskCard from './CleanTaskCard';

const TaskList = ({ 
  tasks, 
  variant = 'default'
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Task List */}
      <div className="p-4 space-y-2">
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
          tasks.map((task) => (
            <CleanTaskCard
              key={task.id}
              task={task}
              variant={variant}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
