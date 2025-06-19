import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../../services/projectService';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';

const TaskManagementWidget = ({ 
  tasks: propTasks = [], 
  project, 
  userRole, 
  permissions = {}, 
  onTaskUpdate,
  onTaskDelete,
  className 
}) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState(propTasks);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('board');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    assignee: '',
    search: ''
  });

  const { socket, isConnected } = useSocket();

  // Function to check if current user can update task status
  const canUpdateTaskStatus = (task = null) => {
    if (!currentUser || !project) return false;
    
    // Find user's role in the project
    const userMember = project.members?.find(member => {
      const memberUserId = member.user?._id || member.user?.id || member.user;
      const currentUserId = currentUser._id || currentUser.id;
      return memberUserId === currentUserId;
    });
    
    if (!userMember) return false;
    
    // Supervisors and team-leads can always update task status
    if (userMember.role === 'supervisor' || userMember.role === 'team-lead') {
      return true;
    }
    
    // For specific tasks, check if user is assigned to that task
    if (task && task.assignedTo) {
      const isAssignedToTask = task.assignedTo.some(assignment => {
        const assignedUserId = assignment.user?._id || assignment.user?.id || assignment.user;
        const currentUserId = currentUser._id || currentUser.id;
        return assignedUserId === currentUserId;
      });
      return isAssignedToTask;
    }
    
    // For bulk operations, only supervisors and team-leads are allowed
    return false;
  };

  // Function to check if user can update status for all selected tasks
  const canUpdateSelectedTasksStatus = () => {
    if (!canUpdateTaskStatus()) return false; // Basic role check first
    
    // For supervisors and team-leads, allow bulk operations
    const userMember = project.members?.find(member => {
      const memberUserId = member.user?._id || member.user?.id || member.user;
      const currentUserId = currentUser._id || currentUser.id;
      return memberUserId === currentUserId;
    });
    
    if (userMember && (userMember.role === 'supervisor' || userMember.role === 'team-lead')) {
      return true;
    }
    
    // For team members, check if they are assigned to ALL selected tasks
    if (selectedTasks.length === 0) return false;
    
    return selectedTasks.every(taskId => {
      const task = tasks.find(t => t._id === taskId);
      return canUpdateTaskStatus(task);
    });
  };

  // Update local state when prop changes
  useEffect(() => {
    setTasks(propTasks);
  }, [propTasks]);

  // Fetch tasks when project changes
  useEffect(() => {
    if (project?._id || project?.id) {
      fetchTasks();
    }
  }, [project?._id, project?.id]);

  // Real-time task updates via Socket.IO
  useEffect(() => {
    const handleTaskUpdate = (event) => {
      const { task, action, projectId, type } = event.detail;
      
      // Only update if this is for the current project
      if (projectId !== (project?._id || project?.id)) return;

      // Handle different types of task updates
      if (type === 'task_created' || action === 'created') {
        setTasks(prev => [task, ...prev]);
        toast.success(`New task "${task.title}" has been created`);
      } else if (type === 'task_updated' || action === 'updated') {
        setTasks(prev => prev.map(t => t._id === task._id ? { ...t, ...task } : t));
        if (onTaskUpdate) onTaskUpdate(task);
      } else if (type === 'task_deleted' || action === 'deleted') {
        setTasks(prev => prev.filter(t => t._id !== task._id));
        if (onTaskDelete) onTaskDelete(task._id);
        toast.success(`Task "${task.title}" has been deleted`);
      } else if (type === 'task_status_changed' || action === 'status_changed') {
        setTasks(prev => prev.map(t => 
          t._id === task._id ? { ...t, status: task.status } : t
        ));
      } else if (type === 'task_assigned' || action === 'assigned') {
        setTasks(prev => prev.map(t => 
          t._id === task._id ? { ...t, assignedTo: task.assignedTo } : t
        ));
      }
    };

    // Listen for all task-related events
    window.addEventListener('task_status_changed', handleTaskUpdate);
    window.addEventListener('taskUpdated', handleTaskUpdate);
    window.addEventListener('new_task_comment', handleTaskUpdate);

    return () => {
      window.removeEventListener('task_status_changed', handleTaskUpdate);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
      window.removeEventListener('new_task_comment', handleTaskUpdate);
    };
  }, [project?._id, project?.id, onTaskUpdate, onTaskDelete]);

  const fetchTasks = async () => {
    if (!project?._id && !project?.id) return;
    
    try {
      setLoading(true);
      const response = await projectService.getTasks(project._id || project.id);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setTasks(response.data);
      } else if (Array.isArray(response.data) && response.data.length === 0) {
        setTasks([]);
      } // else, do not update tasks (prevents accidental clearing)
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Utility to normalize status to board columns
  const normalizeStatus = (status) => {
    if (["not-started", "todo"].includes(status)) return "not-started";
    if (["in-progress", "in-review", "review", "on-hold"].includes(status)) return "in-progress";
    if (["completed", "done"].includes(status)) return "completed";
    return "not-started"; // fallback
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.status && normalizeStatus(task.status) !== filter.status) return false;
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.assignee && task.assignedTo?.id !== filter.assignee) return false;
    if (filter.search && !task.title.toLowerCase().includes(filter.search.toLowerCase()) && 
        !task.description?.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const tasksByStatus = {
    'not-started': filteredTasks.filter(t => normalizeStatus(t.status) === 'not-started'),
    'in-progress': filteredTasks.filter(t => normalizeStatus(t.status) === 'in-progress'),
    'completed': filteredTasks.filter(t => normalizeStatus(t.status) === 'completed')
  };

  // Map frontend status to backend status
  const toBackendStatus = (status) => {
    switch (status) {
      case 'not-started': return 'todo';
      case 'in-progress': return 'in-progress';
      case 'completed': return 'done';
      case 'on-hold': return 'review';
      default: return status;
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    // Find the task to check assignment
    const task = tasks.find(t => t._id === taskId);
    const isAssignedToTask = task && task.assignedTo && task.assignedTo.some(assignment => {
      const assignedUserId = assignment.user?._id || assignment.user?.id || assignment.user;
      const currentUserId = currentUser?._id || currentUser?.id;
      return assignedUserId === currentUserId;
    });

    // Check permissions: supervisor, team-lead, or assigned member can update status
    const canUpdateStatus = userRole === 'supervisor' || 
                           userRole === 'team-lead' || 
                           userRole === 'teamLead' ||
                           isAssignedToTask;

    if (!canUpdateStatus) {
      toast.error('Only supervisors, team leads, and assigned members can update task status');
      return;
    }

    try {
      setLoading(true);
      const taskService = (await import('../../../services/taskService')).default;
      const backendStatus = toBackendStatus(newStatus);
      const updatedTask = await taskService.updateTask(project._id || project.id, taskId, { status: backendStatus });
      updatedTask.status = normalizeStatus(updatedTask.status);
      setTasks(prev => {
        // If the updated task is not found in prev, add it; otherwise, update it in place
        const found = prev.some(t => t._id === taskId);
        if (found) {
          return prev.map(t => t._id === taskId ? { ...t, ...updatedTask } : t);
        } else {
          return [updatedTask, ...prev];
        }
      });
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
      toast.success('Task status updated successfully');
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error(error.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    // Check if user can update status for all selected tasks
    const selectedTaskObjects = tasks.filter(t => selectedTasks.includes(t._id));
    const canUpdateAllTasks = selectedTaskObjects.every(task => {
      const isAssignedToTask = task.assignedTo && task.assignedTo.some(assignment => {
        const assignedUserId = assignment.user?._id || assignment.user?.id || assignment.user;
        const currentUserId = currentUser?._id || currentUser?.id;
        return assignedUserId === currentUserId;
      });

      return userRole === 'supervisor' || 
             userRole === 'team-lead' || 
             userRole === 'teamLead' ||
             isAssignedToTask;
    });

    if (!canUpdateAllTasks) {
      toast.error('You can only update status for tasks assigned to you or if you are a supervisor/team lead');
      return;
    }

    if (selectedTasks.length === 0) {
      toast.error('Please select tasks to update');
      return;
    }

    try {
      setLoading(true);
      await projectService.bulkUpdateTasks(project._id || project.id, {
        taskIds: selectedTasks,
        updates: { status }
      });
      
      setTasks(prev => prev.map(t => 
        selectedTasks.includes(t._id) ? { ...t, status } : t
      ));
      
      setSelectedTasks([]);
      setShowBulkActions(false);
      toast.success(`Updated ${selectedTasks.length} tasks`);
    } catch (error) {
      console.error('Failed to bulk update tasks:', error);
      toast.error(error.message || 'Failed to update tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!permissions?.canDeleteTasks && userRole !== 'supervisor') {
      toast.error('You do not have permission to delete tasks');
      return;
    }

    if (selectedTasks.length === 0) {
      toast.error('Please select tasks to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedTasks.length} tasks?`)) {
      return;
    }

    try {
      setLoading(true);
      await projectService.bulkDeleteTasks(project._id || project.id, selectedTasks);
      
      setTasks(prev => prev.filter(t => !selectedTasks.includes(t._id)));
      
      if (onTaskDelete) {
        selectedTasks.forEach(taskId => onTaskDelete(taskId));
      }
      
      setSelectedTasks([]);
      setShowBulkActions(false);
      toast.success(`Deleted ${selectedTasks.length} tasks`);
    } catch (error) {
      console.error('Failed to bulk delete tasks:', error);
      toast.error(error.message || 'Failed to delete tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSelection = (taskId, checked) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTasks(filteredTasks.map(t => t._id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task._id);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    // Map board column to canonical status
    let statusToSet = newStatus;
    // Use canonical board status, but send backend value
    handleTaskStatusChange(taskId, statusToSet);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not-started': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className={`widget-card ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <svg className="h-5 w-5 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m9-4h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-7 4h6" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Management</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTasks.length} of {tasks.length} tasks
              {selectedTasks.length > 0 && ` • ${selectedTasks.length} selected`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Bulk Actions */}
          {selectedTasks.length > 0 && canUpdateSelectedTasksStatus() && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium"
              >
                Bulk Actions ({selectedTasks.length})
              </button>
              {showBulkActions && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleBulkStatusUpdate('in-progress')}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={loading}
                  >
                    Start
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('completed')}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={loading}
                  >
                    Complete
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}

          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'board'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              List
            </button>
          </div>

          {permissions.canCreate && (
            <Link
              to={`/projects/${project._id || project.id}/tasks/create`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Task
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Search tasks..."
          value={filter.search}
          onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        
        <select
          value={filter.status}
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        
        <select
          value={filter.priority}
          onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="selectAll"
            checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="selectAll" className="text-sm text-gray-600 dark:text-gray-400">
            Select All
          </label>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {/* Task Board View */}
        {view === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['not-started', 'in-progress', 'completed'].map(status => (
              <div
                key={status}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
                onDrop={(e) => handleDrop(e, status)}
                onDragOver={(e) => e.preventDefault()}
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  {status === 'not-started' ? 'Not Started' : status === 'in-progress' ? 'In Progress' : 'Completed'} ({tasksByStatus[status]?.length || 0})
                </h3>
                <div className="space-y-3 min-h-[200px]">
                  {(tasksByStatus[status] || []).map(task => {
                    // Calculate days left
                    let daysLeft = null;
                    if (task.dueDate) {
                      const due = new Date(task.dueDate);
                      const today = new Date();
                      // Zero out time for accurate day diff
                      due.setHours(0,0,0,0);
                      today.setHours(0,0,0,0);
                      daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                    }
                    return (
                      <div
                        key={task._id}
                        draggable={permissions.canEdit}
                        onDragStart={(e) => handleDragStart(e, task)}
                        className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-shadow flex items-center justify-between"
                      >
                        <Link
                          to={`/tasks/${task._id}`}
                          className="flex-1 font-medium text-gray-900 dark:text-white text-sm truncate hover:underline"
                          style={{ minWidth: 0 }}
                          onClick={e => e.stopPropagation()}
                          tabIndex={0}
                          role="button"
                          aria-label={`View details for ${task.title}`}
                        >
                          {task.title}
                        </Link>
                        {typeof daysLeft === 'number' && (
                          <div className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold flex items-center ${
                            daysLeft < 0
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : daysLeft <= 3
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}D overdue` : `${daysLeft}D`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Task List View */}
        {view === 'list' && (
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <div
                key={task._id}
                className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task._id)}
                      onChange={(e) => handleTaskSelection(task._id, e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <Link
                      to={`/tasks/${task._id}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {task.title}
                    </Link>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    {task.assignedTo && (
                      <span>{task.assignedTo.name}</span>
                    )}
                    <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading tasks...</span>
          </div>
        )}

        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <p className="text-gray-600 dark:text-gray-400">No tasks found</p>
            {permissions.canCreate && (
              <Link
                to={`/projects/${project._id || project.id}/tasks/create`}
                className="inline-flex items-center mt-3 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create your first task
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagementWidget;
