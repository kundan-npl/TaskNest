import { useMemo } from 'react';

// Hook to calculate task statistics
export const useTaskStats = (tasks, currentUserId) => {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        onHold: 0,
        overdue: 0,
        userTasks: [],
        completionRate: 0
      };
    }

    // Filter tasks for current user
    const userTasks = tasks.filter(task => 
      task.assignedTo && task.assignedTo.id === currentUserId
    );

    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === 'completed').length;
    const inProgress = userTasks.filter(t => t.status === 'in-progress').length;
    const notStarted = userTasks.filter(t => t.status === 'not-started').length;
    const onHold = userTasks.filter(t => t.status === 'on-hold').length;
    
    // Calculate overdue tasks
    const overdue = userTasks.filter(task => 
      new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      onHold,
      overdue,
      userTasks,
      completionRate
    };
  }, [tasks, currentUserId]);
};

// Hook to calculate project statistics
export const useProjectStats = (projects, currentUserId) => {
  return useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        onHold: 0,
        userProjects: [],
        averageProgress: 0
      };
    }

    // Filter projects where user is involved
    const userProjects = projects.filter(project => 
      project.members?.some(member => member.id === currentUserId) ||
      project.manager?.id === currentUserId
    );

    const total = userProjects.length;
    const active = userProjects.filter(p => p.status === 'active').length;
    const completed = userProjects.filter(p => p.status === 'completed').length;
    const onHold = userProjects.filter(p => p.status === 'on-hold').length;

    const averageProgress = total > 0 
      ? Math.round(userProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / total)
      : 0;

    return {
      total,
      active,
      completed,
      onHold,
      userProjects,
      averageProgress
    };
  }, [projects, currentUserId]);
};

// Hook to sort and filter tasks
export const useSortedTasks = (tasks, currentUserId) => {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        sortedTasks: [],
        overdueTasks: [],
        upcomingTasks: [],
        completedTasks: []
      };
    }

    // Filter tasks for current user
    const userTasks = tasks.filter(task => 
      task.assignedTo && task.assignedTo.id === currentUserId
    );

    // Sort by due date
    const sortedTasks = [...userTasks].sort((a, b) => 
      new Date(a.dueDate) - new Date(b.dueDate)
    );

    // Categorize tasks
    const overdueTasks = sortedTasks.filter(task => 
      new Date(task.dueDate) < new Date() && task.status !== 'completed'
    );

    const upcomingTasks = sortedTasks.filter(task => 
      !overdueTasks.includes(task) && task.status !== 'completed'
    );

    const completedTasks = sortedTasks.filter(task => 
      task.status === 'completed'
    );

    return {
      sortedTasks,
      overdueTasks,
      upcomingTasks,
      completedTasks
    };
  }, [tasks, currentUserId]);
};

// Hook to generate mock weekly data (for demo purposes)
export const useWeeklyData = () => {
  return useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => {
      const created = Math.floor(Math.random() * 5) + 1;
      const completed = Math.floor(Math.random() * created) + (created > 3 ? 0 : 1);
      const completion = created > 0 ? Math.round((completed / created) * 100) : 0;
      
      return {
        day,
        created,
        completed,
        completion
      };
    });
  }, []);
};
