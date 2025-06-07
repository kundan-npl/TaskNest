import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../../services/projectService';
import { useSocket } from '../../../context/SocketContext';

const TaskManagementWidget = ({ 
  tasks: propTasks = [], 
  project, 
  userRole, 
  permissions = {}, 
  onTaskUpdate,
  onTaskDelete,
  className 
}) => {
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
      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.assignee && task.assignedTo?.id !== filter.assignee) return false;
    if (filter.search && !task.title.toLowerCase().includes(filter.search.toLowerCase()) && 
        !task.description?.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const tasksByStatus = {
    'not-started': filteredTasks.filter(t => t.status === 'not-started'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'completed': filteredTasks.filter(t => t.status === 'completed')
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    if (!permissions?.canAssignTasks && userRole === 'teamMember') {
      toast.error('You do not have permission to update task status');
      return;
    }

    try {
      setLoading(true);
      const updatedTask = await projectService.updateTaskStatus(
        project._id || project.id, 
        taskId, 
        newStatus
      );
      
      setTasks(prev => prev.map(t => 
        t._id === taskId ? { ...t, status: newStatus } : t
      ));
      
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
    if (!permissions?.canAssignTasks && userRole === 'teamMember') {
      toast.error('You do not have permission to update task status');
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
    handleTaskStatusChange(taskId, newStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'not-started': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
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
          {selectedTasks.length > 0 && (
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
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <div
                key={status}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
                onDrop={(e) => handleDrop(e, status)}
                onDragOver={(e) => e.preventDefault()}
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-3 capitalize">
                  {status.replace('-', ' ')} ({statusTasks.length})
                </h3>
                
                <div className="space-y-3 min-h-[200px]">
                  {statusTasks.map(task => (
                    <div
                      key={task._id}
                      draggable={permissions.canEdit}
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600 cursor-move hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedTasks.includes(task._id)}
                            onChange={(e) => handleTaskSelection(task._id, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Link
                            to={`/tasks/${task._id}`}
                            className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                          >
                            {task.title}
                          </Link>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                        {task.assignedTo && (
                          <span className="bg-gray-100 dark:bg-gray-600 rounded-full px-2 py-1">
                            {task.assignedTo.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
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
