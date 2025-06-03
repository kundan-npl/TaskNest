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

  // Auto-refresh controls
  const { 
    isAutoRefreshEnabled, 
    lastRefresh, 
    toggleAutoRefresh 
  } = useDashboardAutoRefresh();

  // Legacy state for backward compatibility with existing components
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Use legacy hooks for components that haven't been updated yet
  const taskStats = useTaskStats(tasks, currentUser?.id);
  const projectStats = useProjectStats(projects, currentUser?.id);
  const { sortedTasks, overdueTasks, upcomingTasks, completedTasks } = useSortedTasks(tasks, currentUser?.id);
  const weeklyData = useWeeklyData();

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const interval = setInterval(() => {
      refresh();
      refreshActivities();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled, refresh, refreshActivities]);

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

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Header Section with Real-time Indicators */}
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
              {/* Real-time connection indicator */}
              <div className={`ml-2 flex items-center px-2 py-1 rounded-full text-xs ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {isConnected ? 'Live' : 'Offline'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <button
                onClick={refresh}
                disabled={dashboardLoading}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                {dashboardLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={toggleAutoRefresh}
                className={`text-xs px-2 py-1 rounded ${
                  isAutoRefreshEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Auto-refresh {isAutoRefreshEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Projects"
          value={dashboardStats?.projects?.total || projectStats.total}
          icon="📁"
          trend={dashboardStats?.projects?.total > 0 ? '+5%' : null}
          subtitle={`${dashboardStats?.projects?.active || projectStats.active} active`}
        />
        <StatsCard
          title="Total Tasks"
          value={dashboardStats?.tasks?.total || taskStats.total}
          icon="✅"
          trend={dashboardStats?.tasks?.completed > 0 ? '+12%' : null}
          subtitle={`${dashboardStats?.tasks?.completed || taskStats.completed} completed`}
        />
        <StatsCard
          title="Upcoming Tasks"
          value={dashboardStats?.tasks?.upcoming || upcomingTasks.length}
          icon="⏰"
          trend={dashboardStats?.tasks?.upcoming > 0 ? 'Due soon' : null}
          subtitle="Next 3 days"
        />
        <StatsCard
          title="Overdue Tasks"
          value={dashboardStats?.tasks?.overdue || overdueTasks.length}
          icon="🔴"
          trend={dashboardStats?.tasks?.overdue > 0 ? 'Needs attention' : null}
          subtitle="Past due date"
          alertColor={dashboardStats?.tasks?.overdue > 0}
        />
      </div>

      {/* Performance Metrics Section */}
      {performanceMetrics && !metricsLoading && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{performanceMetrics.tasksCompleted}</div>
                <div className="text-sm text-gray-600">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{performanceMetrics.onTimeCompletion}%</div>
                <div className="text-sm text-gray-600">On-time Completion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{performanceMetrics.averageCompletionTime}</div>
                <div className="text-sm text-gray-600">Avg. Days to Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{performanceMetrics.productivityScore}</div>
                <div className="text-sm text-gray-600">Productivity Score</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Status Distribution</h3>
          <TaskStatusChart 
            data={dashboardStats?.tasks || taskStats}
            realTimeUpdate={isConnected}
          />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Progress</h3>
          <TaskCompletionChart 
            data={performanceMetrics?.weeklyProgress || weeklyData}
            realTimeUpdate={isConnected}
          />
        </div>
      </div>

      {/* Role-based Statistics */}
      <div className="mb-6">
        <RoleBasedStats 
          currentUser={currentUser}
          dashboardStats={dashboardStats}
          isRealTime={isConnected}
        />
      </div>

      {/* Recent Activity and Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Projects</h3>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-800">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {(dashboardStats?.recentProjects || projects.slice(0, 3)).map((project) => (
              <div key={project._id || project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Link to={`/projects/${project._id || project.id}`}>
                    <h4 className="font-medium text-gray-900 hover:text-primary-600">{project.name}</h4>
                  </Link>
                  <div className="flex items-center space-x-2 mt-1">
                    <ProjectStatusBadge status={project.status} />
                    <span className="text-xs text-gray-500">
                      {project.progress || 0}% complete
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {project.memberCount || 0} members
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            <div className="flex items-center space-x-2">
              {isConnected && (
                <div className="flex items-center text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Live
                </div>
              )}
              <button
                onClick={refreshActivities}
                disabled={activitiesLoading}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                {activitiesLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 text-sm">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-gray-800">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-4 text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Tasks</h3>
          <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-800">
            View All Tasks
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(dashboardStats?.recentTasks || tasks.slice(0, 6)).map((task) => (
            <TaskCard
              key={task._id || task.id}
              task={task}
              showProject={true}
              realTimeUpdate={isConnected}
            />
          ))}
        </div>
      </div>

      {/* Admin System Overview */}
      {hasRole(['admin']) && systemHealth && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">System Health</h3>
                <div className="flex items-center">
                  <div className="rounded-full w-3 h-3 bg-green-500 mr-2"></div>
                  <span className="font-semibold text-gray-800">Excellent</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  All services operational
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
                <div className="font-semibold text-gray-800">{systemHealth.users?.active || 0}</div>
                <div className="mt-2 text-xs text-gray-500">
                  Total: {systemHealth.users?.total || 0}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">System Load</h3>
                <div className="font-semibold text-gray-800">Low</div>
                <div className="mt-2 text-xs text-gray-500">
                  Performance optimal
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for activity icons
const getActivityIcon = (type) => {
  switch (type) {
    case 'task_update':
      return '📋';
    case 'project_creation':
      return '📁';
    case 'user_registration':
      return '👤';
    case 'task_completed':
      return '✅';
    case 'project_completed':
      return '🎉';
    default:
      return '📝';
  }
};

export default Dashboard;
