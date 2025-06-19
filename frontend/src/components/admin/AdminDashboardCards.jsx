import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatsCard from '../common/StatsCard.jsx';

const AdminDashboardCards = ({ 
  systemHealth, 
  performanceMetrics, 
  isConnected, 
  systemLoading, 
  metricsLoading 
}) => {
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    pendingTasks: 0,
    systemLoad: 0
  });

  useEffect(() => {
    // Simulate fetching additional admin stats
    setSystemStats({
      totalUsers: 127,
      activeProjects: 43,
      pendingTasks: 89,
      systemLoad: 34
    });

    setRecentAlerts([
      { id: 1, type: 'info', message: 'System backup completed successfully', time: '2 minutes ago' },
      { id: 2, type: 'warning', message: 'High memory usage detected on server-2', time: '15 minutes ago' },
      { id: 3, type: 'success', message: 'Database optimization completed', time: '1 hour ago' }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">System Health Overview</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${systemHealth?.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-gray-600">
              {systemHealth?.status === 'healthy' ? 'All Systems Operational' : 'Monitoring'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="System Status"
            value={systemHealth?.status === 'healthy' ? 'Healthy' : 'Warning'}
            subtitle={systemHealth?.message || 'All services operational'}
            color={systemHealth?.status === 'healthy' ? 'green' : 'yellow'}
            isLive={isConnected}
            isLoading={systemLoading}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatsCard
            title="Active Users"
            value={systemHealth?.activeUsers || systemStats.totalUsers}
            subtitle={`${systemHealth?.dailyLogins || 45} logins today`}
            color="blue"
            isLive={isConnected}
            isLoading={systemLoading}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
          />

          <StatsCard
            title="Storage Usage"
            value={`${systemHealth?.storage?.used || 68}%`}
            subtitle={`${systemHealth?.storage?.usedGB || 5.4}GB / ${systemHealth?.storage?.totalGB || 8}GB`}
            progress={systemHealth?.storage?.used || 68}
            color={systemHealth?.storage?.used > 80 ? 'red' : 'green'}
            isLive={isConnected}
            isLoading={systemLoading}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            }
          />

          <StatsCard
            title="Memory Usage"
            value={`${systemHealth?.memory?.used || 72}%`}
            subtitle={`${systemHealth?.memory?.usedGB || 5.8}GB / ${systemHealth?.memory?.totalGB || 8}GB`}
            progress={systemHealth?.memory?.used || 72}
            color={systemHealth?.memory?.used > 85 ? 'red' : 'blue'}
            isLive={isConnected}
            isLoading={systemLoading}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Performance Metrics</h3>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Response Time"
              value={`${Math.round((performanceMetrics.avgResponseTime || 245) * 10) / 10}ms`}
              subtitle={performanceMetrics.responseTimeTrend === 'up' ? 'Improving' : 'Needs attention'}
              color={performanceMetrics.avgResponseTime < 300 ? 'green' : 'yellow'}
              trend={performanceMetrics.responseTimeTrend}
              isLive={isConnected}
              isLoading={metricsLoading}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />

            <StatsCard
              title="System Uptime"
              value={`${Math.round((performanceMetrics.uptime || 99.9) * 100) / 100}%`}
              subtitle="This month"
              color="green"
              trend="up"
              isLive={isConnected}
              isLoading={metricsLoading}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />

            <StatsCard
              title="API Requests"
              value={performanceMetrics.totalApiCalls || '2.4K'}
              subtitle="This week"
              color="blue"
              isLive={isConnected}
              isLoading={metricsLoading}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              }
            />

            <StatsCard
              title="Error Rate"
              value={`${Math.round((performanceMetrics.errorRate || 0.1) * 100) / 100}%`}
              subtitle={performanceMetrics.errorRate > 1 ? 'Needs attention' : 'Excellent'}
              color={performanceMetrics.errorRate > 1 ? 'red' : 'green'}
              trend={performanceMetrics.errorRate > 1 ? 'down' : 'up'}
              isLive={isConnected}
              isLoading={metricsLoading}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Admin Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/users" 
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-900">Manage Users</h4>
              <p className="text-xs text-gray-500">View and manage user accounts</p>
            </div>
          </Link>

          <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-900">Backup System</h4>
              <p className="text-xs text-gray-500">Create system backup</p>
            </div>
          </button>

          <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-900">View Reports</h4>
              <p className="text-xs text-gray-500">System analytics & reports</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent System Alerts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Recent System Alerts</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Alerts
          </button>
        </div>

        <div className="space-y-3">
          {recentAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  alert.type === 'success' ? 'bg-green-500' :
                  alert.type === 'warning' ? 'bg-yellow-500' :
                  alert.type === 'error' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">{alert.time}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardCards;
