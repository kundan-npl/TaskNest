import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TaskManagementWidget = ({ 
  tasks = [], 
  project, 
  userRole, 
  permissions = {}, 
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  className = '' 
}) => {
  const [view, setView] = useState('board'); // 'board' or 'list'
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    assignee: ''
  });

  const filteredTasks = tasks.filter(task => {
    if (filter.status && task.status !== filter.status) return false;
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.assignee && task.assignedTo?.id !== filter.assignee) return false;
    return true;
  });

  const tasksByStatus = {
    'not-started': filteredTasks.filter(t => t.status === 'not-started'),
    'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
    'completed': filteredTasks.filter(t => t.status === 'completed')
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    if (onTaskUpdate) {
      const task = tasks.find(t => t._id === taskId);
      if (task) {
        await onTaskUpdate({ ...task, status: newStatus });
      }
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
      <div className="widget-header">
        <h2 className="widget-title">Task Management</h2>
        <div className="flex items-center space-x-2">
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
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Task
            </Link>
          )}
        </div>
      </div>

      <div className="widget-content">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
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

          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>

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
                        <Link
                          to={`/tasks/${task._id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                        >
                          {task.title}
                        </Link>
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

        {filteredTasks.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <p className="text-gray-600 dark:text-gray-400">No tasks found</p>
            {permissions.canCreate && (
              <Link
                to={`/projects/${project._id || project.id}/tasks/create`}
                className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
