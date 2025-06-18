import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatDate, getProgressPercentage, getTimeLeft } from '../../../utils/projectHelpers';
import projectService from '../../../services/projectService';
import { useSocket } from '../../../context/SocketContext';

const ProjectOverviewWidget = ({ 
  project, 
  tasks = [], 
  userRole, 
  permissions = {}, 
  onUpdate,
  className = '' 
}) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectData, setProjectData] = useState(project);

  const { socket, isConnected } = useSocket();

  if (!project) return null;

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!project._id && !project.id) return;
      
      try {
        setLoading(true);
        const analyticsData = await projectService.getProjectAnalytics(project._id || project.id);
        setAnalytics(analyticsData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch project analytics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [project._id, project.id, tasks.length]); // Re-fetch when tasks array length changes

  // Also fetch analytics when tasks prop changes significantly
  useEffect(() => {
    if (tasks && tasks.length > 0 && project._id) {
      // Debounce analytics refresh to avoid too many calls
      const timeoutId = setTimeout(() => {
        projectService.getProjectAnalytics(project._id || project.id)
          .then(analyticsData => {
            setAnalytics(analyticsData);
            setError(null);
          })
          .catch(err => {
            console.error('Failed to refresh analytics:', err);
          });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [tasks, project._id, project.id]);

  // Real-time project updates via Socket.IO
  useEffect(() => {
    const handleProjectUpdate = (event) => {
      const { project: updatedProject, action, projectId } = event.detail;
      
      // Only update if this is for the current project
      if (projectId !== (project?._id || project?.id)) return;

      switch (action) {
        case 'updated':
          setProjectData(prev => ({ ...prev, ...updatedProject }));
          if (onUpdate) onUpdate(updatedProject);
          
          // Refetch analytics for updated data
          projectService.getProjectAnalytics(projectId)
            .then(analyticsData => setAnalytics(analyticsData))
            .catch(err => console.error('Failed to fetch updated analytics:', err));
          break;
        case 'status_changed':
          setProjectData(prev => ({ ...prev, status: updatedProject.status }));
          toast.success(`Project status changed to ${updatedProject.status}`);
          break;
        case 'member_added':
          setProjectData(prev => ({ 
            ...prev, 
            members: [...(prev.members || []), updatedProject.newMember] 
          }));
          break;
        case 'member_removed':
          setProjectData(prev => ({ 
            ...prev, 
            members: (prev.members || []).filter(m => m._id !== updatedProject.removedMemberId) 
          }));
          break;
        default:
          break;
      }
    };

    // Handle task updates that affect project analytics
    const handleTaskUpdate = (event) => {
      const { task, action, projectId, type } = event.detail;
      
      // Only update if this is for the current project
      if (projectId !== (project?._id || project?.id)) return;

      // Refetch analytics when tasks are created, updated, or deleted
      if (['task_created', 'task_updated', 'task_deleted', 'task_status_changed'].includes(type) ||
          ['created', 'updated', 'deleted', 'status_changed'].includes(action)) {
        
        // Add a small delay to ensure backend has processed the change
        setTimeout(() => {
          projectService.getProjectAnalytics(projectId)
            .then(analyticsData => {
              setAnalytics(analyticsData);
              console.log('Analytics updated due to task change:', analyticsData);
            })
            .catch(err => console.error('Failed to fetch updated analytics after task change:', err));
        }, 500);
      }
    };

    // Listen for project updates via custom events from SocketContext
    window.addEventListener('projectUpdated', handleProjectUpdate);
    
    // Listen for task updates that affect analytics
    window.addEventListener('taskUpdated', handleTaskUpdate);
    window.addEventListener('task_status_changed', handleTaskUpdate);
    window.addEventListener('new_task_created', handleTaskUpdate);
    window.addEventListener('task_deleted', handleTaskUpdate);

    return () => {
      window.removeEventListener('projectUpdated', handleProjectUpdate);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
      window.removeEventListener('task_status_changed', handleTaskUpdate);
      window.removeEventListener('new_task_created', handleTaskUpdate);
      window.removeEventListener('task_deleted', handleTaskUpdate);
    };
  }, [project?._id, project?.id, onUpdate]);

  // Manual refresh function
  const refreshAnalytics = async () => {
    if (!project._id && !project.id) return;
    
    try {
      setLoading(true);
      const analyticsData = await projectService.getProjectAnalytics(project._id || project.id);
      setAnalytics(analyticsData);
      setError(null);
      toast.success('Analytics refreshed');
    } catch (err) {
      console.error('Failed to refresh analytics:', err);
      setError(err.message);
      toast.error('Failed to refresh analytics');
    } finally {
      setLoading(false);
    }
  };

  // Use local project data that can be updated in real-time
  const currentProject = projectData || project;
  const progress = analytics?.completionPercentage || currentProject.progress || getProgressPercentage(tasks);
  const timeLeft = getTimeLeft(currentProject.deadline);

  return (
    <div className={`widget-card ${className}`}>
      <div className="widget-header">
        <h2 className="widget-title">Project Overview</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshAnalytics}
            disabled={loading}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Refresh analytics"
          >
            <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {permissions.canEdit && (
            <Link
              to={`/projects/${project._id || project.id}/edit`}
              className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Edit
            </Link>
          )}
        </div>
      </div>
      
      <div className="widget-content">
        <div className="space-y-4">
          {/* Project Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {currentProject.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                {currentProject.description}
              </p>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentProject.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              currentProject.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
              currentProject.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              currentProject.status === 'planning' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }`}>
              {currentProject.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentProject.priorityLevel === 'high' || currentProject.priorityLevel === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
              currentProject.priorityLevel === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {currentProject.priorityLevel} priority
            </span>
          </div>

          {/* Progress Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  progress >= 80 ? 'bg-green-600' :
                  progress >= 60 ? 'bg-yellow-600' :
                  progress >= 30 ? 'bg-orange-600' :
                  'bg-red-600'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            {analytics && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Project Health: {analytics.projectHealth}% • Time Progress: {analytics.timeProgress}%
              </div>
            )}
          </div>

          {/* Task Statistics */}
          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 animate-pulse">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.totalTasks || 0}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">Total Tasks</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {analytics.completedTasks || 0}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">Completed</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {analytics.inProgressTasks || 0}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">In Progress</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {analytics.overdueTasks || 0}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">Overdue</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {tasks?.length || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentProject.members?.length || 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Team Members</div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="text-sm text-red-600 dark:text-red-400">
                Failed to load analytics: {error}
              </div>
            </div>
          )}

          {/* Project Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(currentProject.startDate) || 'Not set'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Deadline</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(currentProject.deadline) || 'Not set'}
              </div>
            </div>
          </div>

          {/* Time Status */}
          {currentProject.deadline && (
            <div className={`rounded-lg p-3 text-center ${
              timeLeft.includes('Overdue') ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
            }`}>
              <div className={`text-sm font-medium ${
                timeLeft.includes('Overdue') ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                ⏰ {timeLeft}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectOverviewWidget;
