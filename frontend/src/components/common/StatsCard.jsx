import React from 'react';
import { Link } from 'react-router-dom';

const StatsCard = ({ 
  title,
  value,
  icon,
  color = 'blue',
  subtitle,
  progress,
  trend,
  actionLabel,
  actionLink,
  className = ''
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      accent: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      accent: 'text-green-500'
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      accent: 'text-yellow-500'
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      accent: 'text-red-500'
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      accent: 'text-indigo-500'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      accent: 'text-purple-500'
    },
    gray: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      accent: 'text-gray-500'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
          <div className="text-3xl font-bold text-gray-800">{value}</div>
        </div>
        {icon && (
          <div className={`rounded-full ${colors.bg} p-3`}>
            <div className={`w-6 h-6 ${colors.text}`}>
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${
                color === 'green' ? 'bg-green-400' :
                color === 'blue' ? 'bg-blue-400' :
                color === 'yellow' ? 'bg-yellow-400' :
                color === 'red' ? 'bg-red-400' :
                'bg-gray-400'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Subtitle/additional info */}
      <div className="mt-4 flex justify-between items-center">
        {subtitle && (
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend === 'up' ? 'text-green-500 bg-green-100' :
            trend === 'down' ? 'text-red-500 bg-red-100' :
            `${colors.accent} ${colors.bg}`
          }`}>
            {subtitle}
          </div>
        )}
        
        {actionLink && actionLabel && (
          <Link 
            to={actionLink} 
            className={`text-sm ${colors.accent} hover:underline`}
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
