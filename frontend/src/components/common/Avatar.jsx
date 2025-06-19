import React from 'react';

const Avatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  onClick = null,
  showName = false,
  alt = ''
}) => {
  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl'
  };

  // Get user's initials
  const getInitials = (name) => {
    if (!name) return '?';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }
  };

  // Generate consistent color based on user name
  const getBackgroundColor = (name) => {
    if (!name) return 'bg-gray-400';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const userName = user?.name || user?.email || 'Unknown';
  const initials = getInitials(userName);
  const bgColor = getBackgroundColor(userName);
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  const avatarElement = (
    <div 
      className={`
        ${sizeClass}
        ${bgColor}
        rounded-full
        flex items-center justify-center
        text-white font-semibold
        cursor-pointer
        transition-all duration-200
        hover:opacity-80
        ${className}
      `}
      onClick={onClick}
      title={alt || userName}
    >
      {initials}
    </div>
  );

  if (showName) {
    return (
      <div className="flex items-center space-x-2">
        {avatarElement}
        <span className="text-sm font-medium text-gray-900 truncate">
          {userName}
        </span>
      </div>
    );
  }

  return avatarElement;
};

export default Avatar;
