/**
 * Advanced Widget Optimizations for Production
 * Implements lazy loading, virtual scrolling, memoization, and performance enhancements
 */

import React, { Suspense, lazy, memo, useMemo, useCallback, useRef, useEffect, useState, Component } from 'react';

// Lazy loading components
export const LazyProjectOverviewWidget = lazy(() => 
  import('./ProjectOverviewWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Project Overview</div>
  }))
);

export const LazyTaskManagementWidget = lazy(() => 
  import('./TaskManagementWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Task Management</div>
  }))
);

export const LazyTeamManagementWidget = lazy(() => 
  import('./TeamManagementWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Team Management</div>
  }))
);

export const LazyNotificationWidget = lazy(() => 
  import('./NotificationWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Notifications</div>
  }))
);

export const LazyCommunicationWidget = lazy(() => 
  import('./CommunicationWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Communication</div>
  }))
);

export const LazyFilesWidget = lazy(() => 
  import('./FilesWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Files</div>
  }))
);

export const LazyMilestonesWidget = lazy(() => 
  import('./MilestonesWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Milestones</div>
  }))
);

// Enhanced Lazy-loaded widget components with real-time capabilities
export const LazyEnhancedProjectOverviewWidget = lazy(() => 
  import('./enhanced/EnhancedProjectOverviewWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Enhanced Project Overview</div>
  }))
);

export const LazyEnhancedTaskManagementWidget = lazy(() => 
  import('./enhanced/EnhancedTaskManagementWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Enhanced Task Management</div>
  }))
);

export const LazyEnhancedNotificationWidget = lazy(() => 
  import('./enhanced/EnhancedNotificationWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Enhanced Notifications</div>
  }))
);

export const LazyEnhancedCommunicationWidget = lazy(() => 
  import('./enhanced/EnhancedCommunicationWidget').catch(() => ({
    default: () => <div className="widget-error">Failed to load Enhanced Communication</div>
  }))
);

// Widget skeleton loader
export const WidgetSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="mt-6 flex gap-2">
      <div className="h-8 bg-gray-200 rounded w-20"></div>
      <div className="h-8 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
));

// Virtual task list for large datasets
export const VirtualTaskList = memo(({ tasks, itemHeight = 80, maxHeight = 400 }) => {
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef(null);
  
  const visibleCount = Math.ceil(maxHeight / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, tasks.length);
  const visibleTasks = tasks.slice(startIndex, endIndex);
  
  const handleScroll = useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    const newStartIndex = Math.floor(scrollTop / itemHeight);
    setStartIndex(newStartIndex);
  }, [itemHeight]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tasks available
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="border rounded-lg overflow-auto"
      style={{ height: maxHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: tasks.length * itemHeight, position: 'relative' }}>
        {visibleTasks.map((task, index) => (
          <div
            key={task._id || task.id}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
            className="px-4 py-2 border-b border-gray-100"
          >
            <div className="flex items-center justify-between h-full">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
                <p className="text-xs text-gray-500 truncate">{task.description}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status?.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Performance optimization utilities for widgets
export const widgetOptimizations = {
  
  // Memoization helper for expensive widget calculations
  useMemoizedWidgetData: (data, dependencies) => {
    return useMemo(() => {
      if (!data) return null;
      // Process widget data with performance tracking
      const startTime = performance.now();
      const processedData = processWidgetData(data);
      const endTime = performance.now();
      
      if (endTime - startTime > 10) {
        console.warn(`Slow widget data processing: ${endTime - startTime}ms`);
      }
      
      return processedData;
    }, dependencies);
  },

  // Callback optimization for widget handlers
  useOptimizedCallback: (callback, dependencies) => {
    return useCallback(callback, dependencies);
  },

  // Virtual scrolling for large lists in widgets
  useVirtualScrolling: (items, itemHeight = 50, containerHeight = 400) => {
    return useMemo(() => {
      const visibleItems = Math.ceil(containerHeight / itemHeight);
      return {
        visibleItems,
        startIndex: 0,
        endIndex: Math.min(visibleItems, items.length),
        totalHeight: items.length * itemHeight
      };
    }, [items.length, itemHeight, containerHeight]);
  },

  // Debounced search for widget filtering
  useDebouncedSearch: (searchTerm, delay = 300) => {
    const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedTerm(searchTerm);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [searchTerm, delay]);

    return debouncedTerm;
  }
};

// Widget error boundary
export class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    console.error('Widget Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800">Widget Error</h3>
          </div>
          <p className="text-red-700 mb-4">
            Something went wrong loading this widget. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper function to process widget data
function processWidgetData(data) {
  if (!data || typeof data !== 'object') return data;
  
  // Add any data processing logic here
  return data;
}

// Helper function to process widget data
const processWidgetData = (data) => {
  // Example processing logic
  if (!data) return null;
  
  return {
    ...data,
    processed: true,
    timestamp: Date.now()
  };
};

// Widget performance monitoring
export const performanceMonitor = {
  // Track widget render time
  trackRenderTime: (widgetName) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log to analytics or console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${widgetName} render time: ${renderTime.toFixed(2)}ms`);
      }
      
      // Send to analytics service in production
      if (process.env.NODE_ENV === 'production') {
        // Analytics.track('widget_render_time', {
        //   widget: widgetName,
        //   time: renderTime
        // });
      }
    };
  },

  // Track widget interactions
  trackInteraction: (widgetName, action, metadata = {}) => {
    const event = {
      widget: widgetName,
      action,
      timestamp: Date.now(),
      ...metadata
    };

    // Log interaction
    if (process.env.NODE_ENV === 'development') {
      console.log('Widget interaction:', event);
    }

    // Send to analytics
    // Analytics.track('widget_interaction', event);
  }
};

// Widget error boundary helper
export const createWidgetErrorBoundary = (WidgetComponent, fallback) => {
  return class WidgetErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error(`Error in ${WidgetComponent.name}:`, error, errorInfo);
      
      // Log error to monitoring service
      // ErrorReporting.captureException(error, {
      //   component: WidgetComponent.name,
      //   errorInfo
      // });
    }

    render() {
      if (this.state.hasError) {
        return fallback || (
          <div className="widget-card p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Widget Error
            </h3>
            <p className="text-gray-600 mb-4">
              This widget encountered an error and couldn't load properly.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        );
      }

      return <WidgetComponent {...this.props} />;
    }
  };
};

// HOC for widget performance optimization
export const withWidgetOptimizations = (WidgetComponent) => {
  return memo((props) => {
    // Track render performance
    const trackRender = performanceMonitor.trackRenderTime(WidgetComponent.name);
    
    useEffect(() => {
      const stopTracking = trackRender();
      return stopTracking;
    });

    return <WidgetComponent {...props} />;
  });
};

// Widget lazy loading utility
export const lazyLoadWidget = (importFunc, fallback = null) => {
  const LazyWidget = lazy(importFunc);
  
  return (props) => (
    <Suspense 
      fallback={
        fallback || (
          <div className="widget-card p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        )
      }
    >
      <LazyWidget {...props} />
    </Suspense>
  );
};

// Widget configuration system
export const widgetConfig = {
  // Default widget settings
  defaults: {
    refreshInterval: 30000, // 30 seconds
    maxItems: 100,
    animationDuration: 200,
    debounceDelay: 300
  },

  // Widget-specific configurations
  widgets: {
    ProjectOverviewWidget: {
      refreshInterval: 60000, // 1 minute
      showAnimations: true
    },
    TaskManagementWidget: {
      maxVisibleTasks: 50,
      enableDragDrop: true,
      autoSave: true
    },
    TeamManagementWidget: {
      maxVisibleMembers: 20,
      showOnlineStatus: true
    },
    CommunicationWidget: {
      maxMessages: 100,
      enableTypingIndicator: true,
      autoScroll: true
    },
    FilesWidget: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['image/*', 'application/pdf', '.doc', '.docx'],
      thumbnailSize: 150
    },
    MilestonesWidget: {
      defaultView: 'grid',
      showProgress: true
    },
    NotificationWidget: {
      maxNotifications: 50,
      autoMarkRead: true,
      soundEnabled: false
    }
  },

  // Get configuration for a specific widget
  getWidgetConfig: (widgetName) => {
    return {
      ...widgetConfig.defaults,
      ...widgetConfig.widgets[widgetName]
    };
  }
};

export default {
  widgetOptimizations,
  performanceMonitor,
  createWidgetErrorBoundary,
  withWidgetOptimizations,
  lazyLoadWidget,
  widgetConfig
};
