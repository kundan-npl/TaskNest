import React from 'react';
import { Link } from 'react-router-dom';
import TaskStatusBadge from './TaskStatusBadge';

const TaskCard = ({ 
  task, 
  showProject = false,
  showAssignee = true,
  showDescription = false,
  variant = 'default', // 'default', 'compact', 'detailed'
  className = '',
  onClick
}) => {
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(task);
    }
  };

  const getVariantClasses = () => {
    switch(variant) {
      case 'compact':
        return 'p-3 bg-gray-50 hover:bg-gray-100';
      case 'detailed':
        return 'p-4 bg-white border border-gray-200 shadow-sm hover:shadow-md';
      default:
        return 'p-3 bg-gray-50 hover:bg-gray-100';
    }
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const CardContent = () => (
    <div className={`
      rounded-lg transition-colors cursor-pointer
      ${getVariantClasses()}
      ${isOverdue ? 'bg-red-50 hover:bg-red-100' : ''}
      ${className}
    `}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {task.title}
          </h4>
          {showDescription && task.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <TaskStatusBadge status={task.status} size="xs" className="ml-2 flex-shrink-0" />
      </div>

      <div className="space-y-1">
        {showProject && task.projectName && (
          <div className="text-xs text-gray-500">
            Project: {task.projectName}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {showAssignee && task.assignedTo && (
              <div className="flex items-center">
                <img 
                  src={task.assignedTo.avatar} 
                  alt={task.assignedTo.name}
                  className="w-4 h-4 rounded-full mr-1"
                />
                <span className="truncate max-w-20">{task.assignedTo.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {task.priority && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.priority}
              </span>
            )}
            
            {task.dueDate && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        {isOverdue && (
          <div className="text-xs text-red-600 font-medium mt-1">
            ⚠️ Overdue
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return <div onClick={handleClick}><CardContent /></div>;
  }

  return (
    <Link to={`/tasks/${task.id}`}>
      <CardContent />
    </Link>
  );
};

export default TaskCard;
