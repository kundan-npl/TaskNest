import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { toast } from 'react-toastify';

// Import chart components
import TaskStatusChart from '../../components/charts/TaskStatusChart.jsx';
import TaskCompletionChart from '../../components/charts/TaskCompletionChart.jsx';
import RoleBasedStats from '../../components/dashboard/RoleBasedStats.jsx';

// Import new reusable components
import TaskStatusBadge from '../../components/common/TaskStatusBadge.jsx';
import ProjectStatusBadge from '../../components/common/ProjectStatusBadge.jsx';
import TaskCard from '../../components/common/TaskCard.jsx';
import StatsCard from '../../components/common/StatsCard.jsx';

// Import enhanced admin components
import AdminDashboardCards from '../../components/admin/AdminDashboardCards.jsx';
import AdminActivityMonitor from '../../components/admin/AdminActivityMonitor.jsx';
import AdminAnalytics from '../../components/admin/AdminAnalytics.jsx';

// Import enhanced dashboard hooks
import {
  useDashboardData,
  useActivityFeed,
  usePerformanceMetrics,
  useSystemHealth,
  useDashboardAutoRefresh
} from '../../hooks/useDashboardData.js';

// Import legacy dashboard stats hooks for backward compatibility
import { useTaskStats, useProjectStats, useSortedTasks, useWeeklyData } from '../../hooks/useDashboardStats.js';

// Role constants - Updated to match backend systemRole values
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const Dashboard = () => {
  const { currentUser, hasRole } = useAuth();
  const { isConnected, trackDashboardActivity } = useSocket();
  
  // Real-time dashboard data
  const { 
    dashboardStats, 
    loading: dashboardLoading, 
    error: dashboardError, 
    lastUpdated, 
    refresh 
  } = useDashboardData();

  // Activity feed with real-time updates
  const { 
    activities, 
    loading: activitiesLoading, 
    refresh: refreshActivities 
  } = useActivityFeed(10);

  // Performance metrics
  const { 
    metrics: performanceMetrics, 
    loading: metricsLoading 
  } = usePerformanceMetrics('7d');

  // System health (admin only)
  const { 
    systemHealth, 
    loading: systemLoading 
  } = useSystemHealth();

  // Enhanced auto-refresh controls - always enabled
  const { 
    isAutoRefreshEnabled, 
    lastRefresh, 
    refreshInterval,
    updateLastRefresh 
  } = useDashboardAutoRefresh();

  // Legacy state for backward compatibility with existing components
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use legacy hooks for components that haven't been updated yet
  const taskStats = useTaskStats(tasks, currentUser?.id);
  const projectStats = useProjectStats(projects, currentUser?.id);
  const { sortedTasks, overdueTasks, upcomingTasks, completedTasks } = useSortedTasks(tasks, currentUser?.id);
  const weeklyData = useWeeklyData();

  // Enhanced auto-refresh effect - always enabled with shorter intervals
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
      refreshActivities();
      updateLastRefresh();
    }, refreshInterval); // Default 1 minute, configurable

    return () => clearInterval(interval);
  }, [refresh, refreshActivities, updateLastRefresh, refreshInterval]);

  // Real-time updates - trigger immediate refresh when changes occur
  useEffect(() => {
    const handleRealTimeUpdate = () => {
      refresh();
      refreshActivities();
      updateLastRefresh();
    };

    // Listen for existing Socket.IO events that should trigger immediate updates
    window.addEventListener('task_status_changed', handleRealTimeUpdate);
    window.addEventListener('new_task_comment', handleRealTimeUpdate);
    window.addEventListener('member_update', handleRealTimeUpdate);
    window.addEventListener('project_notification', handleRealTimeUpdate);
    window.addEventListener('activity_update', handleRealTimeUpdate);
    window.addEventListener('performance_update', handleRealTimeUpdate);
    window.addEventListener('dashboard_refresh_requested', handleRealTimeUpdate);
    
    // Listen for dashboard-specific real-time events
    window.addEventListener('dashboardUpdate', handleRealTimeUpdate);
    window.addEventListener('taskStatsUpdate', handleRealTimeUpdate);
    window.addEventListener('projectStatsUpdate', handleRealTimeUpdate);
    window.addEventListener('systemStatsUpdate', handleRealTimeUpdate);

    return () => {
      window.removeEventListener('task_status_changed', handleRealTimeUpdate);
      window.removeEventListener('new_task_comment', handleRealTimeUpdate);
      window.removeEventListener('member_update', handleRealTimeUpdate);
      window.removeEventListener('project_notification', handleRealTimeUpdate);
      window.removeEventListener('activity_update', handleRealTimeUpdate);
      window.removeEventListener('performance_update', handleRealTimeUpdate);
      window.removeEventListener('dashboard_refresh_requested', handleRealTimeUpdate);
      window.removeEventListener('dashboardUpdate', handleRealTimeUpdate);
      window.removeEventListener('taskStatsUpdate', handleRealTimeUpdate);
      window.removeEventListener('projectStatsUpdate', handleRealTimeUpdate);
      window.removeEventListener('systemStatsUpdate', handleRealTimeUpdate);
    };
  }, [refresh, refreshActivities, updateLastRefresh]);

  // Update legacy state when dashboard stats change
  useEffect(() => {
    if (dashboardStats) {
      setProjects(dashboardStats.recentProjects || []);
      setTasks(dashboardStats.recentTasks || []);
      
      // Track dashboard interaction
      trackDashboardActivity({
        action: 'dashboard_data_updated',
        timestamp: new Date().toISOString()
      });
    }
  }, [dashboardStats, trackDashboardActivity]);

  // Loading state
  if (dashboardLoading && !dashboardStats) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (dashboardError && !dashboardStats) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-10">
          <div className="text-red-600 mb-4">Failed to load dashboard</div>
          <button 
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Header Section - More compact */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                  ${(currentUser?.systemRole || currentUser?.role) === ROLES.ADMIN ? 'bg-purple-100 text-purple-800' : 
                    'bg-green-100 text-green-800'}`}>
                  {(currentUser?.systemRole || currentUser?.role) === ROLES.ADMIN ? 'Admin' : 'User'}
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600">Here's what's happening with your work</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Real-time Connection Status - Admin only */}
            {hasRole(['admin']) && (
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Live Updates' : 'Disconnected'}
                </span>
              </div>
            )}
            
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              {hasRole(['admin']) && lastUpdated && (
                <div className="text-xs text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Personal Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="My Projects"
          value={dashboardStats?.projects?.total || 0}
          subtitle={`${dashboardStats?.projects?.active || 0} Active • ${dashboardStats?.projects?.completed || 0} Completed`}
          color="indigo"
          isLive={isConnected}
          isLoading={dashboardLoading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        
        <StatsCard
          title="My Tasks"
          value={dashboardStats?.tasks?.assigned || dashboardStats?.tasks?.total || 0}
          subtitle={`${dashboardStats?.tasks?.completed || 0} Completed • ${dashboardStats?.tasks?.inProgress || 0} In Progress`}
          color="blue"
          isLive={isConnected}
          isLoading={dashboardLoading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        
        <StatsCard
          title="Active Tasks"
          value={dashboardStats?.tasks?.inProgress || 0}
          subtitle={`${dashboardStats?.tasks?.todo || 0} To Do • ${dashboardStats?.tasks?.upcoming || 0} Upcoming`}
          color="yellow"
          isLive={isConnected}
          isLoading={dashboardLoading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatsCard
          title="Overdue Tasks"
          value={dashboardStats?.tasks?.overdue || 0}
          subtitle={dashboardStats?.tasks?.overdue > 0 ? 'Need Immediate Attention' : 'All Tasks On Track'}
          color="red"
          trend={dashboardStats?.tasks?.overdue > 0 ? 'down' : 'up'}
          isLive={isConnected}
          isLoading={dashboardLoading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid - More compact layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Charts and Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">My Task Status</h3>
              {dashboardStats ? (
                <TaskStatusChart taskStats={{
                  total: dashboardStats.tasks?.total || 0,
                  completed: dashboardStats.tasks?.completed || 0,
                  inProgress: dashboardStats.tasks?.inProgress || 0,
                  todo: dashboardStats.tasks?.todo || 0,
                  overdue: dashboardStats.tasks?.overdue || 0
                }} />
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Weekly Progress</h3>
              <TaskCompletionChart weeklyData={weeklyData} />
            </div>
          </div>
          
          {/* Recent Projects */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Projects</h3>
              <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All →
              </Link>
            </div>
            
            <div className="space-y-3">
              {dashboardStats?.recentProjects?.length > 0 ? (
                dashboardStats.recentProjects.slice(0, 3).map((project) => (
                  <Link 
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            project.status === 'active' ? 'bg-green-100 text-green-800' :
                            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                          {project.priority && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              project.priority === 'high' ? 'bg-red-100 text-red-800' :
                              project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {project.priority}
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            {project.memberCount} member{project.memberCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center mb-1">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                            <div 
                              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" 
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{project.progress || 0}%</span>
                        </div>
                        {project.dueDate && (
                          <div className="text-xs text-gray-500">
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500 text-sm">No recent projects</p>
                  <p className="text-gray-400 text-xs mt-1">Create your first project to get started</p>
                  <Link 
                    to="/projects/create" 
                    className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Create Project
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Task Management */}
        <div className="space-y-6">
          {/* My Task Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">My Tasks</h3>
              <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All →
              </Link>
            </div>
            
            {(dashboardStats?.tasks?.total || 0) === 0 ? (
              <div className="text-center py-6">
                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-gray-500">No tasks assigned to you</p>
                <p className="text-xs text-gray-400 mt-1">Tasks will appear here when assigned to you</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Task Content with Fixed Height and Scroll */}
                <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                  {/* Overdue Tasks Section */}
                  {(dashboardStats?.tasks?.overdue || 0) > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center sticky top-0 bg-white py-1 z-10">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Overdue ({dashboardStats.tasks.overdue})
                      </h4>
                      <div className="space-y-2 mb-4">
                        {dashboardStats?.recentTasks?.filter(task => {
                          return task.dueDate && new Date(task.dueDate) < new Date() && !['done', 'cancelled'].includes(task.status);
                        }).slice(0, 5).map(task => (
                          <Link
                            key={task._id}
                            to={`/tasks/${task._id}`}
                            className="block p-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <h5 className="font-medium text-sm text-gray-900 truncate">{task.title}</h5>
                            <p className="text-xs text-gray-600 truncate">{task.project?.name || 'No Project'}</p>
                            <p className="text-xs text-red-600 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Active Tasks Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center sticky top-0 bg-white py-1 z-10">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Active Tasks ({(dashboardStats?.tasks?.inProgress || 0) + (dashboardStats?.tasks?.todo || 0) + (dashboardStats?.tasks?.review || 0)})
                    </h4>
                    <div className="space-y-2">
                      {dashboardStats?.recentTasks?.filter(task => 
                        ['in-progress', 'todo', 'review'].includes(task.status)
                      ).slice(0, 10).map(task => (
                        <Link
                          key={task._id}
                          to={`/tasks/${task._id}`}
                          className="block p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm text-gray-900 truncate">{task.title}</h5>
                              <p className="text-xs text-gray-600 truncate">{task.project?.name || 'No Project'}</p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium capitalize ${
                                task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                task.status === 'todo' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'review' ? 'bg-purple-100 text-purple-800' :
                                task.status === 'done' ? 'bg-green-100 text-green-800' :
                                task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.status === 'todo' ? 'To Do' : 
                                 task.status === 'in-progress' ? 'In Progress' : 
                                 task.status === 'review' ? 'Review' : 
                                 task.status === 'done' ? 'Completed' : 
                                 task.status === 'cancelled' ? 'Cancelled' : 
                                 task.status}
                              </span>
                              {task.priority && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium capitalize ${
                                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                          </div>
                          {task.dueDate && (
                            <p className="text-xs text-gray-500 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Summary of task counts - Fixed at bottom */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-200 bg-white">
                  <div className="text-center p-2 bg-blue-50 rounded-md">
                    <div className="text-lg font-semibold text-blue-600">{dashboardStats?.tasks?.todo || 0}</div>
                    <div className="text-xs text-blue-600">To Do</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-md">
                    <div className="text-lg font-semibold text-yellow-600">{dashboardStats?.tasks?.inProgress || 0}</div>
                    <div className="text-xs text-yellow-600">In Progress</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-md">
                    <div className="text-lg font-semibold text-purple-600">{dashboardStats?.tasks?.review || 0}</div>
                    <div className="text-xs text-purple-600">Review</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-md">
                    <div className="text-lg font-semibold text-green-600">{dashboardStats?.tasks?.completed || 0}</div>
                    <div className="text-xs text-green-600">Completed</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Actions - Compact */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/projects/create" className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="p-1 bg-green-100 rounded mr-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">New Project</span>
              </Link>
              
              <Link to="/tasks/create" className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="p-1 bg-blue-100 rounded mr-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">New Task</span>
              </Link>
              
              <Link to="/tasks/calendar" className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="p-1 bg-purple-100 rounded mr-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Calendar</span>
              </Link>
              
              <Link to="/profile" className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="p-1 bg-yellow-100 rounded mr-2">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Admin-only Enhanced System Overview */}
      {hasRole(['admin']) && (
        <div className="mb-8 space-y-6">
          <AdminDashboardCards
            systemHealth={systemHealth}
            performanceMetrics={performanceMetrics}
            isConnected={isConnected}
            systemLoading={systemLoading}
            metricsLoading={metricsLoading}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminActivityMonitor isConnected={isConnected} />
            <AdminAnalytics 
              dashboardStats={dashboardStats}
              isConnected={isConnected}
              loading={dashboardLoading}
            />
          </div>
        </div>
      )}
      
      {/* Real-time Activity Feed */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            {hasRole(['admin']) && (
              <>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {activitiesLoading ? 'Loading...' : `${activities.length} recent activities`}
                </span>
              </>
            )}
            {!hasRole(['admin']) && (
              <span className="text-sm text-gray-500">
                {activitiesLoading ? 'Loading...' : `${activities.length} recent activities`}
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={activity.id || index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'task_completed' ? 'bg-green-500' :
                  activity.type === 'project_created' ? 'bg-blue-500' :
                  activity.type === 'task_assigned' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.message || activity.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {activity.user?.name || activity.userName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">
                {activitiesLoading ? 'Loading activities...' : 'Activities will appear here as they happen'}
              </p>
            </div>
          )}
        </div>
        
        {activities.length > 0 && (
          <div className="mt-4 text-center">
            <button 
              onClick={refreshActivities}
              disabled={activitiesLoading}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium disabled:opacity-50"
            >
              {activitiesLoading ? 'Refreshing...' : 'Load More Activities'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
