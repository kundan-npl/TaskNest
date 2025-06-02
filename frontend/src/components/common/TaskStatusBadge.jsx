import React from 'react';

const TaskStatusBadge = ({ status, size = 'sm', className = '' }) => {
  const getStatusConfig = (status) => {
    switch(status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          label: 'Completed'
        };
      case 'in-progress':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          label: 'In Progress'
        };
      case 'not-started':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          label: 'Not Started'
        };
      case 'on-hold':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          label: 'On Hold'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          label: status || 'Unknown'
        };
    }
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-3 py-2 text-sm'
  };

  const config = getStatusConfig(status);

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.bg} ${config.text} ${sizeClasses[size]} ${className}
      `}
    >
      {config.label}
    </span>
  );
};

export default TaskStatusBadge;
