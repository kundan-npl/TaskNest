import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import taskService from '../../services/taskService';
import TaskCard from '../../components/common/TaskCard.jsx';
import TaskStatusBadge from '../../components/common/TaskStatusBadge.jsx';

const MyTasks = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and view states
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    project: '',
    search: '',
    dueDate: '',
    assignee: 'me' // Default to current user's tasks
  });
  
  const [view, setView] = useState('list'); // 'list', 'board', 'compact'
  const [sortBy, setSortBy] = useState('dueDate'); // 'dueDate', 'priority', 'created', 'title', 'project'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, we would fetch user's tasks from API
      // const userTasks = await taskService.getUserTasks(currentUser.id);
      
      // For now, let's use comprehensive mock data
      const mockTasks = [
        {
          id: '1',
          title: 'Implement User Authentication System',
          description: 'Design and implement JWT-based authentication with role-based access control',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2025-05-15',
          createdAt: '2025-04-10',
          projectId: '1',
          projectName: 'TaskNest Frontend Development',
          assignedTo: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
          createdBy: { id: '3', name: 'Shobha Sharma', avatar: 'https://i.pravatar.cc/150?img=3' },
          subtasks: [
            { id: '1', title: 'Design login form', completed: true },
            { id: '2', title: 'Implement JWT validation', completed: true },
            { id: '3', title: 'Add role-based routing', completed: false },
            { id: '4', title: 'Write authentication tests', completed: false }
          ],
          tags: ['authentication', 'security', 'frontend']
        },
        {
          id: '2',
          title: 'Create Task Dashboard UI',
          description: 'Build responsive dashboard with drag-and-drop task management',
          status: 'not-started',
          priority: 'medium',
          dueDate: '2025-05-20',
          createdAt: '2025-04-12',
          projectId: '1',
          projectName: 'TaskNest Frontend Development',
          assignedTo: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
          createdBy: { id: '3', name: 'Shobha Sharma', avatar: 'https://i.pravatar.cc/150?img=3' },
          subtasks: [
            { id: '1', title: 'Design wireframes', completed: false },
            { id: '2', title: 'Implement drag and drop', completed: false },
            { id: '3', title: 'Add task filtering', completed: false }
          ],
          tags: ['ui', 'dashboard', 'react']
        },
        {
          id: '3',
          title: 'API Endpoint Testing',
          description: 'Write comprehensive test suite for all API endpoints',
          status: 'completed',
          priority: 'high',
          dueDate: '2025-04-30',
          createdAt: '2025-04-08',
          projectId: '2',
          projectName: 'TaskNest Backend API',
          assignedTo: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
          createdBy: { id: '4', name: 'Kundan Kumar', avatar: 'https://i.pravatar.cc/150?img=4' },
          subtasks: [
            { id: '1', title: 'Test auth endpoints', completed: true },
            { id: '2', title: 'Test project endpoints', completed: true },
            { id: '3', title: 'Test task endpoints', completed: true },
            { id: '4', title: 'Performance testing', completed: true }
          ],
          tags: ['testing', 'api', 'backend']
        },
        {
          id: '4',
          title: 'Database Schema Optimization',
          description: 'Optimize MongoDB queries and add proper indexing',
          status: 'on-hold',
          priority: 'low',
          dueDate: '2025-06-01',
          createdAt: '2025-04-15',
          projectId: '2',
          projectName: 'TaskNest Backend API',
          assignedTo: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
          createdBy: { id: '4', name: 'Kundan Kumar', avatar: 'https://i.pravatar.cc/150?img=4' },
          subtasks: [
            { id: '1', title: 'Analyze current queries', completed: true },
            { id: '2', title: 'Add database indexes', completed: false },
            { id: '3', title: 'Optimize aggregation pipelines', completed: false }
          ],
          tags: ['database', 'optimization', 'mongodb']
        },
        {
          id: '5',
          title: 'Mobile App UI Design',
          description: 'Create mobile-responsive design for TaskNest mobile app',
          status: 'in-progress',
          priority: 'medium',
          dueDate: '2025-05-25',
          createdAt: '2025-04-18',
          projectId: '3',
          projectName: 'TaskNest Mobile App',
          assignedTo: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
          createdBy: { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' },
          subtasks: [
            { id: '1', title: 'Design home screen', completed: true },
            { id: '2', title: 'Design task list screen', completed: true },
            { id: '3', title: 'Design settings screen', completed: false },
            { id: '4', title: 'Create design system', completed: false }
          ],
          tags: ['mobile', 'ui', 'design']
        },
        {
          id: '6',
          title: 'Setup CI/CD Pipeline',
          description: 'Configure automated testing and deployment pipeline',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2025-05-10', // Overdue
          createdAt: '2025-04-05',
          projectId: '2',
          projectName: 'TaskNest Backend API',
          assignedTo: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
          createdBy: { id: '4', name: 'Kundan Kumar', avatar: 'https://i.pravatar.cc/150?img=4' },
          subtasks: [
            { id: '1', title: 'Setup GitHub Actions', completed: true },
            { id: '2', title: 'Configure test automation', completed: true },
            { id: '3', title: 'Setup staging deployment', completed: false },
            { id: '4', title: 'Setup production deployment', completed: false }
          ],
          tags: ['devops', 'ci/cd', 'automation']
        }
      ];

      setTasks(mockTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.message || 'Failed to fetch tasks');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Get unique projects for filter dropdown
  const projects = useMemo(() => {
    const uniqueProjects = [...new Set(tasks.map(task => JSON.stringify({ id: task.projectId, name: task.projectName })))];
    return uniqueProjects.map(p => JSON.parse(p));
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Status filter
      if (filters.status && task.status !== filters.status) return false;
      
      // Priority filter
      if (filters.priority && task.priority !== filters.priority) return false;
      
      // Project filter
      if (filters.project && task.projectId !== filters.project) return false;
      
      // Search filter
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !task.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      // Due date filter
      if (filters.dueDate) {
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        
        switch (filters.dueDate) {
          case 'overdue':
            if (dueDate >= today || task.status === 'completed') return false;
            break;
          case 'today':
            if (dueDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (dueDate < today || dueDate > weekFromNow) return false;
            break;
          case 'month':
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            if (dueDate < today || dueDate > monthFromNow) return false;
            break;
        }
      }
      
      // Show/hide completed
      if (!showCompleted && task.status === 'completed') return false;
      
      return true;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'created':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'project':
          comparison = a.projectName.localeCompare(b.projectName);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [tasks, filters, sortBy, sortOrder, showCompleted]);

  // Get task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const notStarted = tasks.filter(t => t.status === 'not-started').length;
    const onHold = tasks.filter(t => t.status === 'on-hold').length;
    const overdue = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
    
    return { total, completed, inProgress, notStarted, onHold, overdue };
  }, [tasks]);

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    return {
      'not-started': filteredAndSortedTasks.filter(t => t.status === 'not-started'),
      'in-progress': filteredAndSortedTasks.filter(t => t.status === 'in-progress'),
      'on-hold': filteredAndSortedTasks.filter(t => t.status === 'on-hold'),
      'completed': filteredAndSortedTasks.filter(t => t.status === 'completed')
    };
  }, [filteredAndSortedTasks]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Handle bulk operations
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedTasks.size === 0) {
      toast.warning('Please select tasks to update');
      return;
    }

    try {
      // In real implementation, call API to update multiple tasks
      // await taskService.bulkUpdateTasks(Array.from(selectedTasks), { status: newStatus });
      
      setTasks(prev => prev.map(task => 
        selectedTasks.has(task.id) ? { ...task, status: newStatus } : task
      ));
      
      setSelectedTasks(new Set());
      toast.success(`Updated ${selectedTasks.size} tasks to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update tasks');
    }
  };

  // Handle task selection
  const handleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Select all visible tasks
  const handleSelectAll = () => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(t => t.id)));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      project: '',
      search: '',
      dueDate: '',
      assignee: 'me'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-20">
          <div className="text-red-600 text-xl mb-4">Error loading tasks</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchTasks} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
            <p className="text-gray-600 mt-1">
              Manage and track your assigned tasks across all projects
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link to="/tasks/calendar" className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar View
            </Link>
            <Link to="/projects" className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Task
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-800">{taskStats.total}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-600">{taskStats.notStarted}</div>
          <div className="text-sm text-gray-600">Not Started</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{taskStats.onHold}</div>
          <div className="text-sm text-gray-600">On Hold</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input pl-10 w-64"
              />
              <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-select"
            >
              <option value="">All Status</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="form-select"
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Project Filter */}
            <select
              value={filters.project}
              onChange={(e) => handleFilterChange('project', e.target.value)}
              className="form-select"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            {/* Due Date Filter */}
            <select
              value={filters.dueDate}
              onChange={(e) => handleFilterChange('dueDate', e.target.value)}
              className="form-select"
            >
              <option value="">Any Due Date</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
              <option value="month">Due This Month</option>
            </select>

            {/* Reset Filters */}
            <button onClick={resetFilters} className="btn-secondary">
              Reset Filters
            </button>
          </div>

          {/* View and Sort Controls */}
          <div className="flex items-center gap-3">
            {/* Show Completed Toggle */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="form-checkbox h-4 w-4 text-primary-600"
              />
              <span className="ml-2 text-sm text-gray-700">Show Completed</span>
            </label>

            {/* Sort Controls */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select text-sm"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="created">Sort by Created</option>
              <option value="title">Sort by Title</option>
              <option value="project">Sort by Project</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-gray-600 hover:text-gray-800"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <svg className={`w-4 h-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('board')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setView('compact')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  view === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-800">
              {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('in-progress')}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('completed')}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('on-hold')}
                className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Put On Hold
              </button>
              <button
                onClick={() => setSelectedTasks(new Set())}
                className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Content */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">
            {tasks.length === 0 
              ? "You don't have any tasks assigned yet." 
              : "No tasks match your current filters."
            }
          </p>
          {tasks.length === 0 ? (
            <Link to="/projects" className="btn-primary">
              Browse Projects
            </Link>
          ) : (
            <button onClick={resetFilters} className="btn-secondary">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* List View */}
          {view === 'list' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    Tasks ({filteredAndSortedTasks.length})
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {selectedTasks.size === filteredAndSortedTasks.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div className="divide-y">
                {filteredAndSortedTasks.map(task => (
                  <div key={task.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => handleTaskSelection(task.id)}
                        className="mt-1 h-4 w-4 text-primary-600 form-checkbox"
                      />
                      <div className="flex-1">
                        <TaskCard
                          task={task}
                          variant="detailed"
                          showProject={true}
                          showDueDate={true}
                          showAssignee={false}
                          showSubtasks={true}
                          className="border-0 shadow-none p-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Board View */}
          {view === 'board' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                <div key={status} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 capitalize flex items-center gap-2">
                      <TaskStatusBadge status={status} />
                      {status.replace('-', ' ')} ({statusTasks.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {statusTasks.map(task => (
                      <div key={task.id} className="relative">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleTaskSelection(task.id)}
                          className="absolute top-2 right-2 h-4 w-4 text-primary-600 form-checkbox z-10"
                        />
                        <TaskCard
                          task={task}
                          variant="card"
                          showProject={true}
                          showDueDate={true}
                          showAssignee={false}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compact View */}
          {view === 'compact' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    Tasks ({filteredAndSortedTasks.length})
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {selectedTasks.size === filteredAndSortedTasks.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
              <div className="divide-y">
                {filteredAndSortedTasks.map(task => (
                  <div key={task.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => handleTaskSelection(task.id)}
                        className="h-4 w-4 text-primary-600 form-checkbox"
                      />
                      <div className="flex-1">
                        <TaskCard
                          task={task}
                          variant="compact"
                          showProject={true}
                          showDueDate={true}
                          showAssignee={false}
                          className="border-0 shadow-none p-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyTasks;
