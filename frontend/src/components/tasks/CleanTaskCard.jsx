import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import TaskStatusBadge from '../common/TaskStatusBadge';

const CleanTaskCard = ({ 
  task, 
  onClick,
  variant = 'default' // 'default', 'compact', 'board'
}) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleCardClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(task);
    }
  };

  const CardContent = () => {
    // Board variant - Only show task title
    if (variant === 'board') {
      return (
        <div className={`
          p-3 bg-white border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300
          ${isOverdue && task.status !== 'completed' ? 'border-red-200 bg-red-50' : 'border-gray-200'}
        `}>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm leading-tight break-words">
                {task.title}
              </h3>
            </div>
          </div>
        </div>
      );
    }

    // Compact variant - Single line with minimal info
    if (variant === 'compact') {
      return (
        <div className={`
          flex items-center gap-3 p-2 bg-white border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300
          ${isOverdue && task.status !== 'completed' ? 'border-red-200 bg-red-50' : 'border-gray-200'}
        `}>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate text-sm">
              {task.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <TaskStatusBadge status={task.status} size="xs" />
            {task.priority && (
              <span className={`
                inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                ${getPriorityColor(task.priority)}
              `}>
                {task.priority.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Default variant - Full info layout
    return (
      <div className={`
        flex items-center justify-between p-3 bg-white border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300
        ${isOverdue && task.status !== 'completed' ? 'border-red-200 bg-red-50' : 'border-gray-200'}
      `}>
        {/* Left: Task Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {task.title}
            </h3>
          </div>
        </div>

        {/* Right: Due Date, Status, Priority */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Due Date */}
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-sm ${
              isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
            }`}>
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              {isOverdue && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />}
            </div>
          )}

          {/* Status Badge */}
          <TaskStatusBadge status={task.status} size="sm" />

          {/* Priority Badge */}
          {task.priority && (
            <span className={`
              inline-flex items-center px-2 py-1 rounded text-xs font-medium
              ${getPriorityColor(task.priority)}
            `}>
              {task.priority.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (onClick) {
    return <div onClick={handleCardClick}><CardContent /></div>;
  }

  return (
    <Link to={`/tasks/${task.id}`} className="block">
      <CardContent />
    </Link>
  );
};

export default CleanTaskCard;
