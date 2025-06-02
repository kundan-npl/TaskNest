import React from 'react';

const ProjectStatusBadge = ({ status, size = 'sm', className = '' }) => {
  const getStatusConfig = (status) => {
    switch(status) {
      case 'active':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          label: 'Active'
        };
      case 'completed':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          label: 'Completed'
        };
      case 'on-hold':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          label: 'On Hold'
        };
      case 'planning':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          label: 'Planning'
        };
      case 'archived':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          label: 'Archived'
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

export default ProjectStatusBadge;
