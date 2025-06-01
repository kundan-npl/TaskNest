// Widget Index - Centralized widget exports
// This file provides a central point for importing all widgets

import { lazy } from 'react';

// Standard imports (for immediate loading)
export { default as ProjectOverviewWidget } from './ProjectOverviewWidget';
export { default as TaskManagementWidget } from './TaskManagementWidget';
export { default as TeamManagementWidget } from './TeamManagementWidget';
export { default as CommunicationWidget } from './CommunicationWidget';
export { default as FilesWidget } from './FilesWidget';
export { default as MilestonesWidget } from './MilestonesWidget';
export { default as NotificationWidget } from './NotificationWidget';

// Lazy-loaded widgets (for performance optimization)
export const LazyProjectOverviewWidget = lazy(
  () => import('./ProjectOverviewWidget')
);

export const LazyTaskManagementWidget = lazy(
  () => import('./TaskManagementWidget')
);

export const LazyTeamManagementWidget = lazy(
  () => import('./TeamManagementWidget')
);

export const LazyCommunicationWidget = lazy(
  () => import('./CommunicationWidget')
);

export const LazyFilesWidget = lazy(
  () => import('./FilesWidget')
);

export const LazyMilestonesWidget = lazy(
  () => import('./MilestonesWidget')
);

export const LazyNotificationWidget = lazy(
  () => import('./NotificationWidget')
);

// Widget registry for dynamic loading
export const widgetRegistry = {
  // Standard widgets
  ProjectOverviewWidget: {
    component: 'ProjectOverviewWidget',
    name: 'Project Overview',
    description: 'Displays project information, progress, and key metrics',
    category: 'core',
    permissions: ['canViewProject'],
    defaultProps: {
      showProgress: true,
      showDeadline: true,
      showTeamOverview: true
    }
  },
  
  TaskManagementWidget: {
    component: 'TaskManagementWidget',
    name: 'Task Management',
    description: 'Comprehensive task management with board and list views',
    category: 'core',
    permissions: ['canViewTasks'],
    defaultProps: {
      defaultView: 'board',
      enableDragDrop: true,
      showFilters: true
    }
  },
  
  TeamManagementWidget: {
    component: 'TeamManagementWidget',
    name: 'Team Management',
    description: 'Manage team members and their roles',
    category: 'core',
    permissions: ['canViewTeam'],
    defaultProps: {
      showOnlineStatus: true,
      enableRoleChanges: false // Based on permissions
    }
  },
  
  CommunicationWidget: {
    component: 'CommunicationWidget',
    name: 'Communication',
    description: 'Project discussions and team communication',
    category: 'collaboration',
    permissions: ['canViewDiscussions'],
    defaultProps: {
      enableTypingIndicator: true,
      autoScroll: true,
      maxMessages: 100
    }
  },
  
  FilesWidget: {
    component: 'FilesWidget',
    name: 'Files',
    description: 'File upload, management, and organization',
    category: 'content',
    permissions: ['canViewFiles'],
    defaultProps: {
      enableDragDrop: true,
      showThumbnails: true,
      enableFolders: true
    }
  },
  
  MilestonesWidget: {
    component: 'MilestonesWidget',
    name: 'Milestones',
    description: 'Project milestone tracking and management',
    category: 'planning',
    permissions: ['canViewMilestones'],
    defaultProps: {
      defaultView: 'grid',
      showProgress: true,
      enableTimeline: true
    }
  },
  
  NotificationWidget: {
    component: 'NotificationWidget',
    name: 'Notifications',
    description: 'Real-time notifications and preferences',
    category: 'system',
    permissions: ['canReceiveNotifications'],
    defaultProps: {
      enableSound: false,
      autoMarkRead: true,
      maxNotifications: 50
    }
  }
};

// Widget categories
export const widgetCategories = {
  core: {
    name: 'Core Features',
    description: 'Essential project management widgets',
    color: 'blue'
  },
  collaboration: {
    name: 'Collaboration',
    description: 'Team communication and collaboration tools',
    color: 'green'
  },
  content: {
    name: 'Content Management',
    description: 'File and content management widgets',
    color: 'purple'
  },
  planning: {
    name: 'Planning & Tracking',
    description: 'Project planning and progress tracking tools',
    color: 'orange'
  },
  system: {
    name: 'System',
    description: 'System notifications and preferences',
    color: 'gray'
  }
};

// Helper functions for widget management
export const widgetUtils = {
  // Get widgets by category
  getWidgetsByCategory: (category) => {
    return Object.entries(widgetRegistry)
      .filter(([key, widget]) => widget.category === category)
      .reduce((acc, [key, widget]) => {
        acc[key] = widget;
        return acc;
      }, {});
  },

  // Get widget by name
  getWidget: (widgetName) => {
    return widgetRegistry[widgetName];
  },

  // Check if user has permission for widget
  hasWidgetPermission: (widgetName, userPermissions) => {
    const widget = widgetRegistry[widgetName];
    if (!widget || !widget.permissions) return true;
    
    return widget.permissions.some(permission => 
      userPermissions.includes(permission)
    );
  },

  // Get available widgets for user
  getAvailableWidgets: (userPermissions) => {
    return Object.entries(widgetRegistry)
      .filter(([name, widget]) => 
        widgetUtils.hasWidgetPermission(name, userPermissions)
      )
      .reduce((acc, [key, widget]) => {
        acc[key] = widget;
        return acc;
      }, {});
  },

  // Get widget component by name
  getWidgetComponent: (widgetName, lazy = false) => {
    const componentMap = lazy ? {
      ProjectOverviewWidget: LazyProjectOverviewWidget,
      TaskManagementWidget: LazyTaskManagementWidget,
      TeamManagementWidget: LazyTeamManagementWidget,
      CommunicationWidget: LazyCommunicationWidget,
      FilesWidget: LazyFilesWidget,
      MilestonesWidget: LazyMilestonesWidget,
      NotificationWidget: LazyNotificationWidget
    } : {
      ProjectOverviewWidget,
      TaskManagementWidget,
      TeamManagementWidget,
      CommunicationWidget,
      FilesWidget,
      MilestonesWidget,
      NotificationWidget
    };

    return componentMap[widgetName];
  }
};

// Widget layout configurations
export const widgetLayouts = {
  default: [
    { widget: 'ProjectOverviewWidget', span: 2, order: 1 },
    { widget: 'NotificationWidget', span: 1, order: 2 },
    { widget: 'TaskManagementWidget', span: 3, order: 3 },
    { widget: 'TeamManagementWidget', span: 1, order: 4 },
    { widget: 'CommunicationWidget', span: 1, order: 5 },
    { widget: 'FilesWidget', span: 1, order: 6 },
    { widget: 'MilestonesWidget', span: 2, order: 7 }
  ],
  
  minimal: [
    { widget: 'ProjectOverviewWidget', span: 2, order: 1 },
    { widget: 'TaskManagementWidget', span: 3, order: 2 },
    { widget: 'TeamManagementWidget', span: 1, order: 3 }
  ],
  
  communication_focused: [
    { widget: 'ProjectOverviewWidget', span: 1, order: 1 },
    { widget: 'CommunicationWidget', span: 2, order: 2 },
    { widget: 'TaskManagementWidget', span: 3, order: 3 },
    { widget: 'TeamManagementWidget', span: 1, order: 4 },
    { widget: 'NotificationWidget', span: 1, order: 5 },
    { widget: 'FilesWidget', span: 1, order: 6 }
  ],
  
  manager_view: [
    { widget: 'ProjectOverviewWidget', span: 2, order: 1 },
    { widget: 'MilestonesWidget', span: 1, order: 2 },
    { widget: 'TeamManagementWidget', span: 1, order: 3 },
    { widget: 'TaskManagementWidget', span: 2, order: 4 },
    { widget: 'FilesWidget', span: 1, order: 5 },
    { widget: 'NotificationWidget', span: 1, order: 6 }
  ]
};

export default {
  widgetRegistry,
  widgetCategories,
  widgetUtils,
  widgetLayouts
};
