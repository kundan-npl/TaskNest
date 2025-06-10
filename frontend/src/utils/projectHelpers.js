// Helper functions for project management
export const getPriorityColor = (priority) => {
  const priorityLower = priority?.toLowerCase() || '';
  switch (priorityLower) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'active': case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'planning': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'not-started': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getProgressPercentage = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter(task => task.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
};

export const getTimeLeft = (deadline) => {
  if (!deadline) return 'No deadline';
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  
  if (diff < 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} days left`;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours} hours left`;
};

// Role-based permissions configuration
export const ROLE_PERMISSIONS = {
  supervisor: {
    canEditProject: true,
    canDeleteProject: true,
    canManageTeam: true,
    canAssignTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canViewAnalytics: true,
    canExportReports: true,
    canManageFiles: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canManageRoles: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canViewFinancials: true,
    canModerateDiscussions: true,
    canPinMessages: true,
    canCreateAnnouncements: true,
    canSendMessage: true,
    canCreateDiscussion: true,
    canViewDiscussions: true
  },
  'team-lead': {
    canEditProject: false,
    canDeleteProject: false,
    canManageTeam: true,
    canAssignTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canViewAnalytics: true,
    canExportReports: true,
    canManageFiles: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canManageRoles: false,
    canInviteMembers: true,
    canRemoveMembers: false,
    canViewFinancials: false,
    canModerateDiscussions: true,
    canPinMessages: true,
    canCreateAnnouncements: false,
    canSendMessage: true,
    canCreateDiscussion: true,
    canViewDiscussions: true
  },
  teamLead: {
    canEditProject: false,
    canDeleteProject: false,
    canManageTeam: true,
    canAssignTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canViewAnalytics: true,
    canExportReports: true,
    canManageFiles: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canManageRoles: false,
    canInviteMembers: true,
    canRemoveMembers: false,
    canViewFinancials: false,
    canModerateDiscussions: true,
    canPinMessages: true,
    canCreateAnnouncements: false,
    canSendMessage: true,
    canCreateDiscussion: true,
    canViewDiscussions: true
  },
  'team-member': {
    canEditProject: false,
    canDeleteProject: false,
    canManageTeam: false,
    canAssignTasks: false,
    canEditTasks: true,
    canDeleteTasks: false,
    canViewAnalytics: false,
    canExportReports: false,
    canManageFiles: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canManageRoles: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canViewFinancials: false,
    canModerateDiscussions: false,
    canPinMessages: false,
    canCreateAnnouncements: false,
    canSendMessage: true,
    canCreateDiscussion: true,
    canViewDiscussions: true
  },
  teamMember: {
    canEditProject: false,
    canDeleteProject: false,
    canManageTeam: false,
    canAssignTasks: false,
    canEditTasks: true,
    canDeleteTasks: false,
    canViewAnalytics: false,
    canExportReports: false,
    canManageFiles: true,
    canViewAllTasks: true,
    canCreateTasks: true,
    canManageRoles: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canViewFinancials: false,
    canModerateDiscussions: false,
    canPinMessages: false,
    canCreateAnnouncements: false,
    canSendMessage: true,
    canCreateDiscussion: true,
    canViewDiscussions: true
  }
};

// Permission checking utilities
export const getUserRole = (project, currentUser) => {
  if (!project || !currentUser) return 'team-member';
  const member = project.members?.find(m => {
    const memberUserId = m.user._id || m.user.id || m.user;
    const currentUserId = currentUser._id || currentUser.id;
    return memberUserId === currentUserId;
  });
  return member ? member.role : 'team-member';
};

export const hasPermission = (project, currentUser, permission) => {
  const userRole = getUserRole(project, currentUser);
  return ROLE_PERMISSIONS[userRole]?.[permission] || false;
};

// Get user permissions based on role or direct permission object
export const getPermissions = (roleOrProject, currentUser) => {
  // If first parameter is a string (role), return permissions for that role
  if (typeof roleOrProject === 'string') {
    return ROLE_PERMISSIONS[roleOrProject] || ROLE_PERMISSIONS['team-member'];
  }
  
  // If first parameter is a project object, get user's role and return permissions
  if (roleOrProject && currentUser) {
    const userRole = getUserRole(roleOrProject, currentUser);
    return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS['team-member'];
  }
  
  // Default fallback
  return ROLE_PERMISSIONS['team-member'];
};
