import React, { useState, useEffect } from 'react';
import StatsCard from '../common/StatsCard.jsx';

const AdminAnalytics = ({ dashboardStats, isConnected, loading }) => {
  const [analyticsData, setAnalyticsData] = useState({
    userGrowth: [],
    projectStats: {},
    taskMetrics: {},
    systemUsage: {}
  });
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    // Simulate analytics data
    setAnalyticsData({
      userGrowth: [
        { date: '2025-01-08', users: 95, active: 78 },
        { date: '2025-01-09', users: 98, active: 82 },
        { date: '2025-01-10', users: 102, active: 85 },
        { date: '2025-01-11', users: 106, active: 89 },
        { date: '2025-01-12', users: 112, active: 94 },
        { date: '2025-01-13', users: 118, active: 98 },
        { date: '2025-01-14', users: 125, active: 103 }
      ],
      projectStats: {
        totalProjects: 145,
        activeProjects: 89,
        completedThisMonth: 12,
        averageCompletionTime: 18.5,
        projectsByStatus: {
          active: 89,
          completed: 34,
          onHold: 15,
          cancelled: 7
        }
      },
      taskMetrics: {
        totalTasks: 1247,
        completedTasks: 892,
        overdueTasks: 23,
        averageCompletionTime: 3.2,
        tasksByPriority: {
          high: 89,
          medium: 234,
          low: 332
        }
      },
      systemUsage: {
        dailyActiveUsers: 103,
        weeklyActiveUsers: 125,
        monthlyActiveUsers: 142,
        averageSessionTime: 2.4,
        bounceRate: 12.3,
        userRetention: 87.5
      }
    });
  }, [timeRange]);

  const getGrowthPercentage = (current, previous) => {
    if (!previous) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">System Analytics</h3>
            <p className="text-sm text-gray-600">Comprehensive system performance and usage metrics</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            {/* Metric Selector */}
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="overview">Overview</option>
              <option value="users">User Analytics</option>
              <option value="projects">Project Analytics</option>
              <option value="tasks">Task Analytics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={analyticsData.systemUsage.monthlyActiveUsers || 142}
          subtitle={`+${getGrowthPercentage(142, 128)}% from last month`}
          color="blue"
          trend="up"
          isLive={isConnected}
          isLoading={loading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Active Projects"
          value={analyticsData.projectStats.activeProjects || 89}
          subtitle={`${analyticsData.projectStats.completedThisMonth || 12} completed this month`}
          color="green"
          trend="up"
          isLive={isConnected}
          isLoading={loading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <StatsCard
          title="Task Completion"
          value={`${Math.round((analyticsData.taskMetrics.completedTasks / analyticsData.taskMetrics.totalTasks) * 100)}%`}
          subtitle={`${analyticsData.taskMetrics.overdueTasks} overdue tasks`}
          color={analyticsData.taskMetrics.overdueTasks > 20 ? 'yellow' : 'green'}
          isLive={isConnected}
          isLoading={loading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatsCard
          title="User Engagement"
          value={`${analyticsData.systemUsage.userRetention}%`}
          subtitle={`${analyticsData.systemUsage.averageSessionTime}h avg session`}
          color="purple"
          trend="up"
          isLive={isConnected}
          isLoading={loading}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Detailed Analytics */}
      {selectedMetric === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">User Growth Trend</h4>
            <div className="space-y-3">
              {analyticsData.userGrowth.map((day, index) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(day.users / 130) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-800 w-8">{day.users}</span>
                    <span className="text-xs text-gray-500">({day.active} active)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Project Status Distribution</h4>
            <div className="space-y-4">
              {Object.entries(analyticsData.projectStats.projectsByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'active' ? 'bg-green-500' :
                      status === 'completed' ? 'bg-blue-500' :
                      status === 'onHold' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status === 'onHold' ? 'On Hold' : status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'active' ? 'bg-green-500' :
                          status === 'completed' ? 'bg-blue-500' :
                          status === 'onHold' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(count / analyticsData.projectStats.totalProjects) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-800 w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'users' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">User Analytics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analyticsData.systemUsage.dailyActiveUsers}
              </div>
              <div className="text-sm text-gray-600">Daily Active Users</div>
              <div className="text-xs text-green-600 mt-1">+8.2% from yesterday</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analyticsData.systemUsage.weeklyActiveUsers}
              </div>
              <div className="text-sm text-gray-600">Weekly Active Users</div>
              <div className="text-xs text-green-600 mt-1">+12.5% from last week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analyticsData.systemUsage.userRetention}%
              </div>
              <div className="text-sm text-gray-600">User Retention Rate</div>
              <div className="text-xs text-green-600 mt-1">+3.1% from last month</div>
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'projects' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">Project Analytics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {analyticsData.projectStats.totalProjects}
              </div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {analyticsData.projectStats.activeProjects}
              </div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {analyticsData.projectStats.completedThisMonth}
              </div>
              <div className="text-sm text-gray-600">Completed This Month</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                {analyticsData.projectStats.averageCompletionTime}d
              </div>
              <div className="text-sm text-gray-600">Avg Completion Time</div>
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'tasks' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">Task Analytics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-md font-semibold text-gray-700 mb-4">Task Status Overview</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Tasks</span>
                  <span className="font-semibold text-gray-800">{analyticsData.taskMetrics.totalTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600">{analyticsData.taskMetrics.completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overdue</span>
                  <span className="font-semibold text-red-600">{analyticsData.taskMetrics.overdueTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Completion</span>
                  <span className="font-semibold text-blue-600">{analyticsData.taskMetrics.averageCompletionTime}d</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="text-md font-semibold text-gray-700 mb-4">Priority Distribution</h5>
              <div className="space-y-3">
                {Object.entries(analyticsData.taskMetrics.tasksByPriority || {}).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        priority === 'high' ? 'bg-red-500' :
                        priority === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700 capitalize">{priority}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Export Analytics Data</h4>
            <p className="text-sm text-gray-600">Download detailed reports for further analysis</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Export PDF
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              Export CSV
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
              Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
