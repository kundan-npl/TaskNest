import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Sidebar = ({ open, collapsed, toggleSidebar, toggleCollapse }) => {
  const { hasRole, currentUser } = useAuth();
  const [showTooltip, setShowTooltip] = useState(null);

  const navigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: ['user', 'admin'],
    },
    {
      name: 'My Projects',
      path: '/projects',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      roles: ['user', 'admin'],
    },
    {
      name: 'Create Project',
      path: '/projects/create',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      roles: ['user', 'admin'],
    },
    {
      name: 'My Tasks',
      path: '/tasks',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      roles: ['user', 'admin'],
    },
    {
      name: 'Calendar',
      path: '/tasks/calendar',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      roles: ['user', 'admin'],
    },
    {
      name: 'System Users',
      path: '/users',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      roles: ['admin'],
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['admin'],
    },
  ];

  const renderTooltip = (item, index) => {
    if (!collapsed || showTooltip !== index) return null;
    
    return (
      <div className="absolute left-16 bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
        {item.name}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={toggleSidebar}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true"></div>
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={`
          bg-gradient-to-b from-blue-800 to-blue-900 transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-52'}
          fixed inset-y-0 left-0 z-50 md:relative md:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`h-16 flex items-center bg-blue-900 shadow-lg transition-all duration-300 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          <Link to="/home" className="flex items-center hover:opacity-80 transition-opacity duration-200">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-bold text-xl text-white ml-3">TaskNest</span>
            )}
          </Link>
          
          {/* Collapse toggle button - Hidden on mobile */}
          <button
            type="button"
            className="hidden md:block text-white hover:text-gray-200 focus:outline-none transition-colors duration-200"
            onClick={toggleCollapse}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            className="md:hidden text-white hover:text-gray-200 focus:outline-none"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-blue-700">
            {currentUser && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                      ${currentUser?.systemRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                      {currentUser?.systemRole === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed User Avatar */}
        {collapsed && currentUser && (
          <div className="px-2 py-3 border-b border-blue-700 flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {currentUser.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`mt-4 ${collapsed ? 'px-1' : 'px-2'}`}>
          <div className="space-y-1">
            {navigation.map((item, index) => 
              hasRole(item.roles) && (
                <div key={item.name} className="relative">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center ${collapsed ? 'justify-center' : ''} px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                      }`
                    }
                    onClick={() => {
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                    onMouseEnter={() => collapsed && setShowTooltip(index)}
                    onMouseLeave={() => collapsed && setShowTooltip(null)}
                  >
                    <span className={collapsed ? '' : 'mr-2'}>{item.icon}</span>
                    {!collapsed && <span>{item.name}</span>}
                  </NavLink>
                  {renderTooltip(item, index)}
                </div>
              )
            )}
          </div>
        </nav>

        {/* Quick Actions */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t border-blue-700 ${collapsed ? 'px-1' : ''}`}>
          <div className="relative">
            <NavLink
              to="/profile"
              className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 text-sm text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-200`}
              onMouseEnter={() => collapsed && setShowTooltip('profile')}
              onMouseLeave={() => collapsed && setShowTooltip(null)}
            >
              <svg className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!collapsed && 'My Profile'}
            </NavLink>
            {collapsed && showTooltip === 'profile' && (
              <div className="absolute left-16 bottom-2 bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                My Profile
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
