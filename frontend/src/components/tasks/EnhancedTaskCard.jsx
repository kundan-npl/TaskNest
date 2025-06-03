import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  UserIcon, 
  FolderIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import TaskStatusBadge from '../common/TaskStatusBadge';

const EnhancedTaskCard = ({ 
  task, 
  variant = 'default', // 'default', 'compact', 'detailed', 'board'
  showProject = true,
  showAssignee = true,
  showDueDate = true,
  showSubtasks = false,
  showTags = false,
  isSelected = false,
  onSelect,
  className = '',
  onClick
}) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getPriorityConfig = (priority) => {
    switch(priority) {
      case 'high':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'low':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);

  const getVariantStyles = () => {
    switch(variant) {
      case 'compact':
        return 'p-3 hover:shadow-sm';
      case 'detailed':
        return 'p-6 hover:shadow-lg';
      case 'board':
        return 'p-4 hover:shadow-md';
      default:
        return 'p-4 hover:shadow-md';
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
      bg-white rounded-xl border transition-all duration-200 cursor-pointer
      ${isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'}
      ${isOverdue && task.status !== 'completed' ? 'border-red-200 bg-red-50' : ''}
      ${getVariantStyles()}
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectClick}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold text-gray-900 mb-1 ${
                variant === 'compact' ? 'text-sm' : 'text-base'
              }`}>
                {task.title}
              </h3>
              {variant !== 'compact' && task.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {task.description}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <TaskStatusBadge status={task.status} size="sm" />
          {task.priority && (
            <span className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${priorityConfig.bg} ${priorityConfig.text}
            `}>
              {task.priority}
            </span>
          )}
        </div>
      </div>

      {/* Content based on variant */}
      {variant !== 'compact' && (
        <>
          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {showProject && task.projectName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FolderIcon className="w-4 h-4 text-gray-400" />
                <span className="truncate">{task.projectName}</span>
              </div>
            )}

            {showAssignee && task.assignedTo && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <img 
                  src={task.assignedTo.avatar} 
                  alt={task.assignedTo.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="truncate">{task.assignedTo.name}</span>
              </div>
            )}

            {showDueDate && task.dueDate && (
              <div className={`flex items-center gap-2 text-sm ${
                isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
              }`}>
                <CalendarIcon className="w-4 h-4" />
                <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                {isOverdue && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Subtasks Progress */}
          {showSubtasks && totalSubtasks > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Subtasks</span>
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Tags */}
          {showTags && task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <TagIcon className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{task.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Compact variant metadata */}
      {variant === 'compact' && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {showProject && task.projectName && (
              <span className="truncate max-w-32">{task.projectName}</span>
            )}
            {showDueDate && task.dueDate && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {showAssignee && task.assignedTo && (
            <div className="flex items-center gap-1">
              <img 
                src={task.assignedTo.avatar} 
                alt={task.assignedTo.name}
                className="w-4 h-4 rounded-full"
              />
              <span className="truncate max-w-20">{task.assignedTo.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Overdue warning */}
      {isOverdue && task.status !== 'completed' && (
        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="font-medium">Overdue</span>
          </div>
        </div>
      )}
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

export default EnhancedTaskCard;
