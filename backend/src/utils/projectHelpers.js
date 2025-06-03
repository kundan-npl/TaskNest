/**
 * Helper function to check user's role in a project
 * @param {Object} project - Project document
 * @param {String} userId - User ID to check
 * @returns {Object|null} - Member object if found, null otherwise
 */
const getUserProjectRole = (project, userId) => {
  if (!project || !project.members || !userId) {
    return null;
  }
  
  return project.members.find(member => {
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
};

/**
 * Helper function to check if user has access to a project
 * @param {Object} project - Project document
 * @param {String} userId - User ID to check
 * @param {String} userRole - User's system role (admin, user)
 * @returns {Boolean} - Whether user has access
 */
const hasProjectAccess = (project, userId, userRole = 'user') => {
  if (!project || !userId) {
    return false;
  }
  
  // Admin has access to all projects
  if (userRole === 'admin') {
    return true;
  }
  
  // Check if user is manager
  if (project.manager && project.manager.toString() === userId.toString()) {
    return true;
  }
  
  // Check if user is a member
  return getUserProjectRole(project, userId) !== null;
};

/**
 * Helper function to check if user can modify a project
 * @param {Object} project - Project document
 * @param {String} userId - User ID to check
 * @param {String} userRole - User's system role (admin, user)
 * @returns {Boolean} - Whether user can modify
 */
const canModifyProject = (project, userId, userRole = 'user') => {
  if (!project || !userId) {
    return false;
  }
  
  // Admin can modify all projects
  if (userRole === 'admin') {
    return true;
  }
  
  // Check if user is manager
  if (project.manager && project.manager.toString() === userId.toString()) {
    return true;
  }
  
  // Check if user is a member with admin role in project
  const member = getUserProjectRole(project, userId);
  return member && member.role === 'admin';
};

module.exports = {
  getUserProjectRole,
  hasProjectAccess,
  canModifyProject
};
