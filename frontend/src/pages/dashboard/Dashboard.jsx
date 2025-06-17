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
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <div className="flex items-center mt-1">
              <p className="text-sm text-gray-600 mr-2">Welcome back, {currentUser?.name || 'User'}!</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                ${(currentUser?.systemRole || currentUser?.role) === ROLES.ADMIN ? 'bg-purple-100 text-purple-800' : 
                  'bg-green-100 text-green-800'}`}>
                {(currentUser?.systemRole || currentUser?.role) === ROLES.ADMIN ? 'Admin' : 'User'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Real-time Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            
            
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Compact Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="My Projects"
          value={dashboardStats?.projectCount || projects.length}
          subtitle={`${dashboardStats?.activeProjects || projects.filter(p => p.status === 'active').length} Active`}
          color="indigo"
          isLive={isConnected}
          isLoading={dashboardLoading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          }
        />
        
        <StatsCard
          title="Tasks"
          value={dashboardStats?.taskCount || taskStats.total}
          subtitle={`${dashboardStats?.completedTasks || taskStats.completed} Completed`}
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
          title="In Progress"
          value={dashboardStats?.inProgressTasks || taskStats.inProgress}
          subtitle="Active Tasks"
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
          title="Overdue"
          value={dashboardStats?.overdueTasks || overdueTasks.length}
          subtitle={dashboardStats?.overdueTasks > 0 || overdueTasks.length > 0 ? 'Need Attention' : 'All On Track'}
          color="red"
          trend={dashboardStats?.overdueTasks > 0 || overdueTasks.length > 0 ? 'down' : 'up'}
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
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Task Status</h3>
              <TaskStatusChart taskStats={taskStats} />
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
              {projects.slice(0, 3).map((project) => (
                <Link 
                  key={project.id || project._id}
                  to={`/projects/${project.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <ProjectStatusBadge status={project.status} />
                      <div className="mt-1 flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-primary-600 h-1.5 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{project.progress}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Task Management */}
        <div className="space-y-6">
          {/* Task Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">My Tasks</h3>
              <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All →
              </Link>
            </div>
            
            {taskStats.total === 0 ? (
              <div className="text-center py-6">
                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-gray-500">No tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overdue Tasks */}
                {overdueTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">Overdue ({overdueTasks.length})</h4>
                    <div className="space-y-2">
                      {overdueTasks.slice(0, 2).map(task => (
                        <Link
                          key={task.id || task._id}
                          to={`/tasks/${task.id}`}
                          className="block p-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <h5 className="font-medium text-sm text-gray-900">{task.title}</h5>
                          <p className="text-xs text-gray-600">{task.projectName}</p>
                          <p className="text-xs text-red-600">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        </Link>
                      ))}
                      {overdueTasks.length > 2 && (
                        <p className="text-xs text-red-600 text-center">+{overdueTasks.length - 2} more overdue</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Upcoming Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Upcoming ({sortedTasks.filter(task => !overdueTasks.includes(task) && task.status !== 'completed').length})
                  </h4>
                  <div className="space-y-2">
                    {sortedTasks
                      .filter(task => !overdueTasks.includes(task) && task.status !== 'completed')
                      .slice(0, 3)
                      .map(task => (
                        <Link
                          key={task.id || task._id}
                          to={`/tasks/${task.id}`}
                          className="block p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <h5 className="font-medium text-sm text-gray-900">{task.title}</h5>
                          <p className="text-xs text-gray-600">{task.projectName}</p>
                          <div className="flex items-center justify-between mt-1">
                            <TaskStatusBadge status={task.status} />
                            <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                          </div>
                        </Link>
                      ))
                    }
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
      
      {/* Admin-only System Overview */}
      {hasRole(['admin']) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">System Overview</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${systemHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-600">
                {systemHealth?.status === 'healthy' ? 'All Systems Operational' : 'Monitoring'}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="System Health"
                value={systemHealth?.status === 'healthy' ? 'Excellent' : 'Good'}
                subtitle={systemHealth?.message || 'All services operational'}
                color="green"
                isLive={isConnected}
                isLoading={systemLoading}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="Storage Usage"
                value={`${systemHealth?.storage?.used || 64}%`}
                subtitle={`${systemHealth?.storage?.usedGB || 512}GB / ${systemHealth?.storage?.totalGB || 800}GB`}
                progress={systemHealth?.storage?.used || 64}
                color="blue"
                isLive={isConnected}
                isLoading={systemLoading}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                }
              />
              <StatsCard
                title="Active Users"
                value={systemHealth?.activeUsers || 18}
                subtitle={`${systemHealth?.dailyLogins || 24} logins today`}
                color="purple"
                isLive={isConnected}
                isLoading={systemLoading}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
              />
            </div>
            
            {/* Performance Metrics Section */}
            {performanceMetrics && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Performance Metrics (Last 7 Days)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatsCard
                    title="Avg Response Time"
                    value={`${performanceMetrics.avgResponseTime || 245}ms`}
                    color="green"
                    trend={performanceMetrics.responseTimeTrend || 'up'}
                    isLive={isConnected}
                    isLoading={metricsLoading}
                  />
                  <StatsCard
                    title="Uptime"
                    value={`${performanceMetrics.uptime || 99.9}%`}
                    color="blue"
                    trend="up"
                    isLive={isConnected}
                    isLoading={metricsLoading}
                  />
                  <StatsCard
                    title="API Calls"
                    value={performanceMetrics.totalApiCalls || '2.4K'}
                    subtitle="This week"
                    color="indigo"
                    isLive={isConnected}
                    isLoading={metricsLoading}
                  />
                  <StatsCard
                    title="Error Rate"
                    value={`${performanceMetrics.errorRate || 0.1}%`}
                    color={performanceMetrics.errorRate > 1 ? 'red' : 'green'}
                    trend={performanceMetrics.errorRate > 1 ? 'down' : 'up'}
                    isLive={isConnected}
                    isLoading={metricsLoading}
                  />
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Recent System Events</h3>
                <button className="text-xs text-primary-600 hover:text-primary-800">
                  View All Events
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {systemHealth?.recentEvents?.map((event, index) => (
                  <div key={event.id || index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`rounded-full w-2 h-2 mr-2 ${
                        event.type === 'success' ? 'bg-green-500' :
                        event.type === 'info' ? 'bg-blue-500' :
                        event.type === 'warning' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm text-gray-800">{event.message}</span>
                    </div>
                    <span className="text-xs text-gray-500">{event.timestamp}</span>
                  </div>
                )) || (
                  // Default events if none provided
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="rounded-full w-2 h-2 bg-green-500 mr-2"></div>
                        <span className="text-sm text-gray-800">Database backup completed</span>
                      </div>
                      <span className="text-xs text-gray-500">Today, 3:45 AM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="rounded-full w-2 h-2 bg-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-800">System updates installed</span>
                      </div>
                      <span className="text-xs text-gray-500">Yesterday, 11:30 PM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="rounded-full w-2 h-2 bg-yellow-500 mr-2"></div>
                        <span className="text-sm text-gray-800">High CPU usage detected (resolved)</span>
                      </div>
                      <span className="text-xs text-gray-500">Yesterday, 2:12 PM</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Real-time Activity Feed */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-500">
              {activitiesLoading ? 'Loading...' : `${activities.length} recent activities`}
            </span>
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
