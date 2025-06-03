import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import dashboardService from '../services/dashboardService';
import { toast } from 'react-toastify';

// Enhanced dashboard hook with real-time updates
export const useDashboardData = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const { 
    isConnected, 
    joinDashboard, 
    leaveDashboard, 
    refreshDashboard,
    trackDashboardActivity 
  } = useSocket();

  // Fetch initial dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getDashboardStats();
      setDashboardStats(data);
      setLastUpdated(new Date());
      
      // Track dashboard view
      trackDashboardActivity({
        action: 'dashboard_viewed',
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [trackDashboardActivity]);

  // Refresh dashboard data
  const refresh = useCallback(async () => {
    await fetchDashboardData();
    refreshDashboard(); // Notify server
  }, [fetchDashboardData, refreshDashboard]);

  // Handle real-time updates
  useEffect(() => {
    const handleDashboardUpdate = (event) => {
      const { type, data } = event.detail;
      
      setDashboardStats(prev => {
        if (!prev) return prev;
        
        switch (type) {
          case 'task_stats':
            return { ...prev, tasks: { ...prev.tasks, ...data } };
          case 'project_stats':
            return { ...prev, projects: { ...prev.projects, ...data } };
          case 'recent_activity':
            return { ...prev, recentProjects: data.projects, recentTasks: data.tasks };
          default:
            return prev;
        }
      });
      
      setLastUpdated(new Date());
    };

    const handleTaskStatsUpdate = (event) => {
      setDashboardStats(prev => prev ? {
        ...prev,
        tasks: { ...prev.tasks, ...event.detail }
      } : prev);
      setLastUpdated(new Date());
    };

    const handleProjectStatsUpdate = (event) => {
      const { projectId, stats } = event.detail;
      setDashboardStats(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          projects: { ...prev.projects, ...stats },
          recentProjects: prev.recentProjects.map(p => 
            p._id === projectId ? { ...p, ...stats } : p
          )
        };
      });
      setLastUpdated(new Date());
    };

    const handleRefreshRequested = () => {
      refresh();
    };

    // Add event listeners
    window.addEventListener('dashboardUpdate', handleDashboardUpdate);
    window.addEventListener('taskStatsUpdate', handleTaskStatsUpdate);
    window.addEventListener('projectStatsUpdate', handleProjectStatsUpdate);
    window.addEventListener('dashboardRefreshRequested', handleRefreshRequested);

    return () => {
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
      window.removeEventListener('taskStatsUpdate', handleTaskStatsUpdate);
      window.removeEventListener('projectStatsUpdate', handleProjectStatsUpdate);
      window.removeEventListener('dashboardRefreshRequested', handleRefreshRequested);
    };
  }, [refresh]);

  // Join/leave dashboard room when connected
  useEffect(() => {
    if (isConnected) {
      joinDashboard();
      return () => leaveDashboard();
    }
  }, [isConnected, joinDashboard, leaveDashboard]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardStats,
    loading,
    error,
    lastUpdated,
    refresh,
    isConnected
  };
};

// User-specific dashboard hook
export const useUserDashboard = (userId) => {
  const [userDashboard, setUserDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDashboard = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const data = await dashboardService.getUserDashboard(userId);
        setUserDashboard(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load user dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDashboard();
  }, [userId]);

  return { userDashboard, loading, error };
};

// Activity feed hook with real-time updates
export const useActivityFeed = (limit = 20) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchActivities = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      const data = await dashboardService.getActivityFeed(limit, currentOffset);
      
      if (reset) {
        setActivities(data);
        setOffset(limit);
      } else {
        setActivities(prev => [...prev, ...data]);
        setOffset(prev => prev + limit);
      }
      
      setHasMore(data.length === limit);
    } catch (err) {
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  // Handle real-time activity updates
  useEffect(() => {
    const handleActivityUpdate = (event) => {
      const newActivity = event.detail;
      setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50
    };

    window.addEventListener('activityUpdate', handleActivityUpdate);
    return () => window.removeEventListener('activityUpdate', handleActivityUpdate);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchActivities(false);
    }
  }, [loading, hasMore, fetchActivities]);

  const refresh = useCallback(() => {
    fetchActivities(true);
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities(true);
  }, []);

  return {
    activities,
    loading,
    hasMore,
    loadMore,
    refresh
  };
};

// Performance metrics hook
export const usePerformanceMetrics = (timeRange = '7d') => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getPerformanceMetrics(timeRange);
        setMetrics(data);
      } catch (err) {
        setError(err.message);
        toast.error('Failed to load performance metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange]);

  // Handle real-time performance updates
  useEffect(() => {
    const handlePerformanceUpdate = (event) => {
      setMetrics(prev => ({ ...prev, ...event.detail }));
    };

    window.addEventListener('performanceUpdate', handlePerformanceUpdate);
    return () => window.removeEventListener('performanceUpdate', handlePerformanceUpdate);
  }, []);

  return { metrics, loading, error };
};

// System health hook (admin only)
export const useSystemHealth = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getSystemHealth();
        setSystemHealth(data);
      } catch (err) {
        setError(err.message);
        // Don't show toast for 403 errors (non-admin users)
        if (!err.message.includes('Access denied')) {
          toast.error('Failed to load system health');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSystemHealth();
  }, []);

  // Handle real-time system stats updates
  useEffect(() => {
    const handleSystemStatsUpdate = (event) => {
      setSystemHealth(prev => ({ ...prev, ...event.detail }));
    };

    window.addEventListener('systemStatsUpdate', handleSystemStatsUpdate);
    return () => window.removeEventListener('systemStatsUpdate', handleSystemStatsUpdate);
  }, []);

  return { systemHealth, loading, error };
};

// Enhanced dashboard auto-refresh hook - always enabled with shorter intervals
export const useDashboardAutoRefresh = () => {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute default

  // Auto-refresh is always enabled now
  const isAutoRefreshEnabled = true;

  // Method to update last refresh time
  const updateLastRefresh = useCallback(() => {
    setLastRefresh(new Date());
  }, []);

  // Method to set custom refresh interval
  const setCustomInterval = useCallback((interval) => {
    setRefreshInterval(interval);
  }, []);

  return {
    isAutoRefreshEnabled,
    lastRefresh,
    refreshInterval,
    updateLastRefresh,
    setCustomInterval
  };
};
