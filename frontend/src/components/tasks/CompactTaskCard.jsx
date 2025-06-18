import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  ExclamationTriangleIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import TaskStatusBadge from '../common/TaskStatusBadge';

const CompactTaskCard = ({ 
  task, 
  isSelected = false,
  onSelect,
  onClick
}) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleCardClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(task);
    }
  };

  const handleSelectClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onSelect) {
      onSelect(task.id);
    }
  };

  const CardContent = () => (
    <div className={`
      flex items-center gap-3 p-3 bg-white border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300
      ${isSelected ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50' : 'border-gray-200'}
      ${isOverdue && task.status !== 'completed' ? 'border-red-200 bg-red-50' : ''}
    `}>
      {/* Selection Checkbox */}
      {onSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectClick}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
      )}

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          {/* Left side - Task info */}
          <div className="flex-1 min-w-0 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate text-sm">
                {task.title}
              </h3>
              <TaskStatusBadge status={task.status} size="xs" />
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* Project */}
              {task.projectName && (
                <div className="flex items-center gap-1">
                  <FolderIcon className="w-3 h-3" />
                  <span className="truncate max-w-32">{task.projectName}</span>
                </div>
              )}
              
              {/* Due Date */}
              {task.dueDate && (
                <div className={`flex items-center gap-1 ${
                  isOverdue ? 'text-red-600 font-medium' : ''
                }`}>
                  <CalendarIcon className="w-3 h-3" />
                  <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                  {isOverdue && <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Priority and Assignee */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Priority Badge */}
            {task.priority && (
              <span className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                ${getPriorityColor(task.priority)}
              `}>
                {task.priority}
              </span>
            )}
            
            {/* Assignee Avatar */}
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <img 
                  src={task.assignedTo.avatar} 
                  alt={task.assignedTo.name}
                  className="w-6 h-6 rounded-full"
                  title={task.assignedTo.name}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return <div onClick={handleCardClick}><CardContent /></div>;
  }

  return (
    <Link to={`/tasks/${task.id}`} className="block">
      <CardContent />
    </Link>
  );
};

export default CompactTaskCard;
