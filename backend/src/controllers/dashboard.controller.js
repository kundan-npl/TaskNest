const Project = require('../models/project.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');
const Discussion = require('../models/discussion.model');
const { asyncHandler } = require('../middleware/error/asyncHandler');
const { getUserProjectRole } = require('../utils/projectHelpers');
const os = require('os');
const mongoose = require('mongoose');

// Helper function to generate mock activity data
const generateActivityFeed = async (userId, limit = 10) => {
  try {
    // Get recent tasks and projects for the user
    const recentTasks = await Task.find({
      $or: [
        { 'assignedTo.user': userId },
        { createdBy: userId }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('assignedTo.user', 'name')
    .populate('project', 'name title')
    .populate('createdBy', 'name');

    const recentProjects = await Project.find({
      'members.user': userId
    })
    .sort({ updatedAt: -1 })
    .limit(5);

    const activities = [];

    // Convert tasks to activities
    recentTasks.forEach(task => {
      let message = '';
      let type = '';
      
      if (task.status === 'done') {
        message = `Task "${task.title}" was completed`;
        type = 'task_completed';
      } else if (task.status === 'in-progress') {
        message = `Task "${task.title}" is now in progress`;
        type = 'task_progress';
      } else {
        message = `Task "${task.title}" was updated`;
        type = 'task_updated';
      }

      // Find the user who made the change (prefer assignee, fallback to creator)
      let activityUser = null;
      if (task.assignedTo && task.assignedTo.length > 0) {
        activityUser = task.assignedTo[0].user;
      } else if (task.createdBy) {
        activityUser = task.createdBy;
      }

      activities.push({
        id: task._id,
        type,
        message,
        timestamp: task.updatedAt,
        user: activityUser,
        projectName: task.project ? (task.project.name || task.project.title) : null
      });
    });

    // Convert projects to activities
    recentProjects.forEach(project => {
      activities.push({
        id: project._id,
        type: 'project_updated',
        message: `Project "${project.title}" was updated`, // Use 'title' field
        timestamp: project.updatedAt,
        user: project.createdBy,
        projectName: project.title // Use 'title' field
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

  } catch (error) {
    console.error('Error generating activity feed:', error);
    return [];
  }
};

// Helper function to get system health metrics
const getSystemHealthMetrics = async () => {
  try {
    const dbStats = await mongoose.connection.db.stats();
    const cpuUsage = os.loadavg()[0];
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Get user counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    return {
      status: cpuUsage < 2 && (usedMemory / totalMemory) < 0.8 ? 'healthy' : 'warning',
      message: 'All systems operational',
      lastChecked: new Date(),
      storage: {
        used: Math.round((dbStats.dataSize / (1024 * 1024 * 1024 * 8)) * 100), // Assume 8GB total
        usedGB: Math.round(dbStats.dataSize / (1024 * 1024 * 1024)),
        totalGB: 8
      },
      memory: {
        used: Math.round((usedMemory / totalMemory) * 100),
        usedGB: Math.round(usedMemory / (1024 * 1024 * 1024)),
        totalGB: Math.round(totalMemory / (1024 * 1024 * 1024))
      },
      activeUsers,
      totalUsers,
      dailyLogins: Math.floor(Math.random() * 50) + 10, // Mock data
      recentEvents: [
        {
          type: 'success',
          message: 'Database backup completed',
          timestamp: 'Today, 3:45 AM'
        },
        {
          type: 'info',
          message: 'System updates installed',
          timestamp: 'Yesterday, 11:30 PM'
        },
        {
          type: 'warning',
          message: 'High CPU usage detected (resolved)',
          timestamp: 'Yesterday, 2:12 PM'
        }
      ]
    };
  } catch (error) {
    console.error('Error getting system health:', error);
    return {
      status: 'error',
      message: 'Unable to fetch system metrics',
      lastChecked: new Date()
    };
  }
};

// Helper function to generate performance metrics
const getPerformanceMetrics = (timeRange = '7d') => {
  // Mock performance data - in production, this would come from monitoring tools
  const baseMetrics = {
    avgResponseTime: 180 + Math.floor(Math.random() * 100),
    uptime: 99.5 + Math.random() * 0.5,
    totalApiCalls: Math.floor(Math.random() * 5000) + 2000,
    errorRate: Math.random() * 0.5,
    responseTimeTrend: Math.random() > 0.5 ? 'up' : 'down'
  };

  return {
    ...baseMetrics,
    timeRange,
    generatedAt: new Date()
  };
};

// @desc    Get dashboard statistics
// @route   GET /api/v1/dashboard/stats
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  try {
    console.log('Getting dashboard stats for user:', req.user.id);
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('Converted to ObjectId:', userId);

    // Get user's projects
    console.log('Querying projects...');
    const userProjects = await Project.find({
      $or: [
        { createdBy: userId },
        { 'members.user': userId }
      ]
    }).select('_id title status priorityLevel deadline createdAt members');
    console.log('Found projects:', userProjects.length);

    const projectIds = userProjects.map(p => p._id);
    console.log('Project IDs:', projectIds);

    // Get user's tasks - Only tasks specifically assigned to the user or created by them
    console.log('Querying tasks...');
    const userTasks = await Task.find({
      $or: [
        { 'assignedTo.user': userId },
        { createdBy: userId }
      ]
    })
    .populate('project', 'name title')
    .populate('assignedTo.user', 'name email')
    .populate('createdBy', 'name email');
    
    console.log('Found tasks:', userTasks.length);
    console.log('Sample task with project:', userTasks[0] ? {
      title: userTasks[0].title,
      project: userTasks[0].project,
      assignedTo: userTasks[0].assignedTo
    } : 'No tasks');

    // Also get tasks from user's projects that are not assigned to anyone (for project managers/supervisors)
    const unassignedProjectTasks = await Task.find({
      project: { $in: projectIds },
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: { $size: 0 } }
      ],
      createdBy: { $ne: userId } // Don't duplicate user's own tasks
    })
    .populate('project', 'name title')
    .populate('createdBy', 'name email');
    
    // Combine and deduplicate tasks
    const allUserTasks = [...userTasks, ...unassignedProjectTasks].reduce((acc, task) => {
      if (!acc.find(t => t._id.toString() === task._id.toString())) {
        acc.push(task);
      }
      return acc;
    }, []);

    // Calculate statistics
    console.log('Calculating task statistics...');
    console.log('Sample task:', JSON.stringify(allUserTasks[0], null, 2));
    
    const stats = {
      projects: {
        total: userProjects.length,
        active: userProjects.filter(p => p.status === 'active').length,
        completed: userProjects.filter(p => p.status === 'completed').length,
        onHold: userProjects.filter(p => p.status === 'on-hold').length,
        overdue: userProjects.filter(p => 
          p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed'
        ).length
      },
      tasks: {
        total: allUserTasks.length,
        assigned: (() => {
          console.log('Calculating assigned tasks...');
          try {
            const assignedTasks = allUserTasks.filter(t => {
              console.log('Task assignedTo:', t.assignedTo);
              return t.assignedTo && t.assignedTo.some(assignment => 
                assignment.user && assignment.user._id && assignment.user._id.toString() === userId.toString()
              );
            });
            return assignedTasks.length;
          } catch (error) {
            console.error('Error in assigned filter:', error);
            return 0;
          }
        })(),
        completed: allUserTasks.filter(t => t.status === 'done').length,
        inProgress: allUserTasks.filter(t => t.status === 'in-progress').length,
        review: allUserTasks.filter(t => t.status === 'review').length,
        todo: allUserTasks.filter(t => t.status === 'todo').length,
        cancelled: allUserTasks.filter(t => t.status === 'cancelled').length,
        overdue: allUserTasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && !['done', 'cancelled'].includes(t.status)
        ).length,
        upcoming: allUserTasks.filter(t => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          const today = new Date();
          const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
          return dueDate >= today && dueDate <= threeDaysFromNow && !['done', 'cancelled'].includes(t.status);
        }).length
      },
      recentProjects: await Promise.all(
        userProjects
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(async (p) => {
            // Calculate progress based on actual task completion
            const [totalTasks, completedTasks] = await Promise.all([
              Task.countDocuments({ project: p._id }),
              Task.countDocuments({ project: p._id, status: 'done' })
            ]);
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return {
              _id: p._id,
              name: p.title, // Use 'title' field from Project model
              status: p.status,
              priority: p.priorityLevel, // Use 'priorityLevel' field from Project model
              dueDate: p.deadline, // Use 'deadline' field from Project model
              progress: progress,
              memberCount: p.members?.length || 0
            };
          })
      ),
      recentTasks: allUserTasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(t => ({
          _id: t._id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          project: t.project ? { 
            _id: t.project._id, 
            name: t.project.name || t.project.title 
          } : null,
          assignedTo: t.assignedTo && t.assignedTo.length > 0 ? 
            t.assignedTo.map(a => ({
              _id: a.user._id,
              name: a.user.name,
              email: a.user.email
            })) : null,
          createdBy: t.createdBy ? {
            _id: t.createdBy._id,
            name: t.createdBy.name,
            email: t.createdBy.email
          } : null
        }))
    };

    console.log('Returning stats:', stats);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    next(error);
  }
});

// @desc    Get user-specific dashboard data
// @route   GET /api/v1/dashboard/user/:userId
// @access  Private
exports.getUserDashboard = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const requesterId = new mongoose.Types.ObjectId(req.user.id);

  // Check if user can access this dashboard (admin or self)
  if (userId !== req.user.id && req.user.systemRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only view your own dashboard.'
    });
  }

  const user = await User.findById(userId).select('-password');
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Get user's projects with detailed information
  const userProjects = await Project.find({
    $or: [
      { createdBy: userObjectId },
      { 'members.user': userObjectId }
    ]
  }).populate('createdBy', 'name email')
    .populate('members.user', 'name email profileImage')
    .sort({ createdAt: -1 });

  // Get user's tasks with project information
  const userTasks = await Task.find({
    'assignedTo.user': userObjectId
  }).populate('project', 'name title status')
    .populate('assignedTo.user', 'name email profileImage')
    .populate('createdBy', 'name email profileImage')
    .sort({ createdAt: -1 });

  // Get activity feed for user
  const activityFeed = await getActivityFeed(userId, 10);

  const dashboard = {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      jobTitle: user.jobTitle,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin,
      isOnline: user.isOnline
    },
    projects: userProjects.map(p => ({
      _id: p._id,
      name: p.title, // Use 'title' field
      description: p.description,
      status: p.status,
      priority: p.priorityLevel, // Use 'priorityLevel' field
      progress: p.progress || 0,
      dueDate: p.deadline, // Use 'deadline' field
      createdAt: p.createdAt,
      manager: p.createdBy,
      memberCount: p.members?.length || 0,
      role: getUserProjectRole(p, userId)
    })),
    tasks: userTasks,
    activityFeed,
    performanceMetrics: {
      completedTasksThisWeek: userTasks.filter(t => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return t.status === 'done' && new Date(t.updatedAt) >= weekAgo;
      }).length,
      averageTaskCompletion: calculateAverageTaskCompletion(userTasks),
      projectParticipation: userProjects.length
    }
  };

  res.status(200).json({
    success: true,
    data: dashboard
  });
});

// @desc    Get dashboard updates since last check
// @route   GET /api/v1/dashboard/updates
// @access  Private
exports.getDashboardUpdates = asyncHandler(async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const { since } = req.query;
  
  if (!since) {
    return res.status(400).json({
      success: false,
      error: 'Since timestamp is required'
    });
  }

  const sinceDate = new Date(parseInt(since));

  // Get updated projects
  const updatedProjects = await Project.find({
    $and: [
      {
        $or: [
          { createdBy: userId },
          { 'members.user': userId }
        ]
      },
      { updatedAt: { $gte: sinceDate } }
    ]
  }).select('_id title status progress updatedAt');

  // Get updated tasks
  const updatedTasks = await Task.find({
    $and: [
      {
        $or: [
          { 'assignedTo.user': userId },
          { project: { $in: await getProjectIds(userId) } }
        ]
      },
      { updatedAt: { $gte: sinceDate } }
    ]
  }).populate('project', 'name').populate('assignedTo.user', 'name email');

  // Get new notifications
  const newNotifications = await getNotificationsSince(userId, sinceDate);

  const updates = {
    projects: updatedProjects,
    tasks: updatedTasks,
    notifications: newNotifications,
    timestamp: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: updates
  });
});

// @desc    Get activity feed
// @route   GET /api/v1/dashboard/activity
// @access  Private
exports.getActivityFeed = asyncHandler(async (req, res, next) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const { limit = 20, offset = 0 } = req.query;

  const activityFeed = await getActivityFeed(userId, parseInt(limit), parseInt(offset));

  res.status(200).json({
    success: true,
    data: activityFeed
  });
});



// @desc    Get system health (admin only)
// @route   GET /api/v1/dashboard/system-health
// @access  Private (Admin)
exports.getSystemHealth = asyncHandler(async (req, res, next) => {
  if (req.user.systemRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  }

  const systemHealth = await getSystemHealthMetrics();

  res.status(200).json({
    success: true,
    data: systemHealth
  });
});

// @desc    Get performance metrics
// @route   GET /api/v1/dashboard/metrics
// @access  Private
exports.getPerformanceMetrics = asyncHandler(async (req, res, next) => {
  const { range = '7d' } = req.query;
  
  const metrics = getPerformanceMetrics(range);

  res.status(200).json({
    success: true,
    data: metrics
  });
});

// Helper functions
async function getActivityFeed(userId, limit = 20, offset = 0) {
  try {
    // Use our enhanced activity generator
    const activities = await generateActivityFeed(userId, limit + offset);
    
    // Apply pagination
    return activities.slice(offset, offset + limit);
  } catch (error) {
    console.error('Error in getActivityFeed:', error);
    return [];
  }
}

async function getProjectIds(userId) {
  const projects = await Project.find({
    $or: [
      { createdBy: userId },
      { 'members.user': userId }
    ]
  }).select('_id');
  return projects.map(p => p._id);
}

async function getNotificationsSince(userId, sinceDate) {
  // This would get notifications from a notifications collection
  // For now, return empty array
  return [];
}

function calculateAverageTaskCompletion(tasks) {
  const completedTasks = tasks.filter(t => t.status === 'done');
  if (completedTasks.length === 0) return 0;

  const totalDays = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt);
    const completed = new Date(task.updatedAt);
    const days = (completed - created) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round(totalDays / completedTasks.length);
}

async function calculatePerformanceMetrics(userId, startDate, endDate) {
  const tasks = await Task.find({
    'assignedTo.user': userId,
    updatedAt: { $gte: startDate, $lte: endDate }
  });

  const completedTasks = tasks.filter(t => t.status === 'done');
  const onTimeTasks = completedTasks.filter(t => 
    !t.dueDate || new Date(t.updatedAt) <= new Date(t.dueDate)
  );

  return {
    tasksCompleted: completedTasks.length,
    onTimeCompletion: completedTasks.length > 0 ? 
      Math.round((onTimeTasks.length / completedTasks.length) * 100) : 0,
    averageCompletionTime: calculateAverageTaskCompletion(completedTasks),
    productivityScore: calculateProductivityScore(tasks),
    weeklyProgress: calculateWeeklyProgress(tasks, startDate, endDate)
  };
}

function calculateProductivityScore(tasks) {
  // Simple productivity calculation based on completion rate and timeliness
  const completed = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  
  if (total === 0) return 0;
  
  const completionRate = completed / total;
  const score = Math.round(completionRate * 100);
  
  return Math.min(score, 100);
}

function calculateWeeklyProgress(tasks, startDate, endDate) {
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const progress = [];

  for (let i = 0; i < days; i++) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    const completedThatDay = tasks.filter(t => 
      t.status === 'done' && 
      new Date(t.updatedAt) >= day && 
      new Date(t.updatedAt) <= dayEnd
    ).length;

    progress.push({
      date: day.toISOString().split('T')[0],
      completed: completedThatDay
    });
  }

  return progress;
}

async function getSystemActivity() {
  // Get recent system-wide activity
  const activities = [];
  
  // Recent user registrations
  const recentUsers = await User.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name createdAt');
  
  recentUsers.forEach(user => {
    activities.push({
      type: 'user_registration',
      message: `New user ${user.name} registered`,
      timestamp: user.createdAt
    });
  });

  // Recent project creations
  const recentProjects = await Project.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('createdBy', 'name');
  
  recentProjects.forEach(project => {
    activities.push({
      type: 'project_creation',
      message: `Project "${project.title}" created by ${project.createdBy.name}`, // Use 'title' field
      timestamp: project.createdAt
    });
  });

  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
}
