import React from 'react';
import EnhancedTaskCard from './EnhancedTaskCard';
import TaskStatusBadge from '../common/TaskStatusBadge';

const TaskBoard = ({ 
  tasksByStatus, 
  selectedTasks, 
  onTaskSelection
}) => {
  const statusColumns = [
    { 
      key: 'not-started', 
      title: 'Not Started', 
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    { 
      key: 'in-progress', 
      title: 'In Progress', 
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      key: 'on-hold', 
      title: 'On Hold', 
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    { 
      key: 'completed', 
      title: 'Completed', 
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statusColumns.map((column) => {
        const tasks = tasksByStatus[column.key] || [];
        
        return (
          <div key={column.key} className="flex flex-col">
            {/* Column Header */}
            <div className={`
              ${column.bgColor} ${column.borderColor} 
              border rounded-t-xl p-4 border-b-0
            `}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TaskStatusBadge status={column.key} size="sm" />
                  <h3 className="font-semibold text-gray-900">
                    {column.title}
                  </h3>
                </div>
                <span className={`
                  inline-flex items-center justify-center w-6 h-6 text-sm font-medium rounded-full
                  ${column.color === 'gray' ? 'bg-gray-200 text-gray-700' :
                    column.color === 'blue' ? 'bg-blue-200 text-blue-700' :
                    column.color === 'yellow' ? 'bg-yellow-200 text-yellow-700' :
                    'bg-green-200 text-green-700'}
                `}>
                  {tasks.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className={`
              flex-1 ${column.bgColor} ${column.borderColor}
              border border-t-0 rounded-b-xl p-4 min-h-96
            `}>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">No tasks in this status</div>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="relative">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => onTaskSelection(task.id)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <EnhancedTaskCard
                            task={task}
                            variant="board"
                            showProject={true}
                            showAssignee={true}
                            showDueDate={true}
                            showSubtasks={true}
                            showTags={true}
                            className="shadow-sm hover:shadow-md"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoard;
