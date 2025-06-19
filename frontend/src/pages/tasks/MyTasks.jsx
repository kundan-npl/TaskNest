import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import TaskStatsDashboard from '../../components/tasks/TaskStatsDashboard.jsx';
import TaskList from '../../components/tasks/TaskList.jsx';
import TaskBoard from '../../components/tasks/TaskBoard.jsx';
import TaskEmptyState from '../../components/tasks/TaskEmptyState.jsx';
import { 
  CalendarIcon, 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ListBulletIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

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

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [currentUser]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Fetch personal tasks first
      const allTasks = [];
      try {
        const personalTasks = await taskService.getPersonalTasks();
        
        if (Array.isArray(personalTasks) && personalTasks.length > 0) {
          const myPersonalTasks = personalTasks.map(task => ({
            ...task,
            projectId: null,
            projectName: 'Personal Tasks'
          }));
          allTasks.push(...myPersonalTasks);
        }
      } catch (personalTaskError) {
        // Continue with project tasks even if personal tasks fail
      }
      
      // 2. Fetch all projects for the user
      const projects = await projectService.getAllProjects();
      
      if (projects && projects.length > 0) {
        // 3. For each project, fetch its tasks
        for (const project of projects) {
          try {
            const projectTasks = await taskService.getProjectTasks(project._id);
            
            if (Array.isArray(projectTasks)) {
              // Filter for tasks assigned to the current user and add project info
              const myTasks = projectTasks
                .filter((task) => Array.isArray(task.assignedTo) && task.assignedTo.some(a => (a.user?._id || a.user) === currentUser._id))
                .map(task => ({
                  ...task,
                  projectId: project._id,
                  projectName: project.name || project.title
                }));
              allTasks.push(...myTasks);
            }
          } catch (err) {
            continue;
          }
        }
      }
      
      setTasks(allTasks);
    } catch (err) {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique projects for filter dropdown
  const projects = useMemo(() => {
    const uniqueProjects = [...new Set(tasks.map(task => JSON.stringify({ id: task.projectId, name: task.projectName })))];
    const parsedProjects = uniqueProjects
      .map(p => JSON.parse(p))
      .filter(p => p.id && p.name); // Filter out invalid projects
    
    return parsedProjects;
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    // Status normalization function
    const normalizeStatus = (status) => {
      if (!status) return 'not-started';
      const statusLower = status.toLowerCase();
      
      // Map "done" from backend to "completed" for frontend consistency  
      if (['completed', 'done', 'finished'].includes(statusLower)) return 'completed';
      if (['in-progress', 'in_progress', 'inprogress', 'active', 'working'].includes(statusLower)) return 'in-progress';
      if (['not-started', 'not_started', 'notstarted', 'todo', 'pending', 'new'].includes(statusLower)) return 'not-started';
      if (['review', 'in-review', 'in_review', 'reviewing'].includes(statusLower)) return 'review';
      if (['on-hold', 'on_hold', 'onhold', 'paused', 'blocked', 'cancelled'].includes(statusLower)) return 'on-hold';
      
      return 'not-started';
    };
    
    let filtered = tasks.filter(task => {
      // Status filter - use normalized status
      if (filters.status && normalizeStatus(task.status) !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && task.priority !== filters.priority) return false;
      
      // Project filter - check both projectId and project._id for flexibility
      if (filters.project && task.projectId !== filters.project && task.project?._id !== filters.project) return false;
      
      // Search filter
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !task.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      // Due date filter
      if (filters.dueDate) {
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        
        switch (filters.dueDate) {
          case 'overdue':
            if (dueDate >= today || normalizeStatus(task.status) === 'completed') return false;
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
      if (!showCompleted && normalizeStatus(task.status) === 'completed') {
        return false;
      }
      
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
    
    // Handle different status formats that might come from backend
    const normalizeStatus = (status) => {
      if (!status) return 'not-started';
      const statusLower = status.toLowerCase();
      
      // Map various status formats to our expected values
      if (['completed', 'done', 'finished'].includes(statusLower)) return 'completed';
      if (['in-progress', 'in_progress', 'inprogress', 'active', 'working'].includes(statusLower)) return 'in-progress';
      if (['not-started', 'not_started', 'notstarted', 'todo', 'pending', 'new'].includes(statusLower)) return 'not-started';
      if (['review', 'in-review', 'in_review', 'reviewing'].includes(statusLower)) return 'review';
      if (['on-hold', 'on_hold', 'onhold', 'paused', 'blocked', 'cancelled'].includes(statusLower)) return 'on-hold';
      
      return 'not-started'; // default fallback
    };
    
    const completed = tasks.filter(t => normalizeStatus(t.status) === 'completed').length;
    const inProgress = tasks.filter(t => normalizeStatus(t.status) === 'in-progress').length;
    const notStarted = tasks.filter(t => normalizeStatus(t.status) === 'not-started').length;
    const review = tasks.filter(t => normalizeStatus(t.status) === 'review').length;
    const onHold = tasks.filter(t => normalizeStatus(t.status) === 'on-hold').length;
    
    // Fix overdue calculation - only count tasks with valid due dates that are past due and not completed
    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false; // Skip tasks without due dates
      if (normalizeStatus(t.status) === 'completed') return false; // Skip completed tasks
      
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today to be more accurate
      
      return dueDate < today;
    }).length;
    
    // Validation: ensure status counts add up correctly
    const statusSum = completed + inProgress + notStarted + review + onHold;
    if (statusSum !== total && total > 0) {
      console.warn('Task status counts do not match total:', {
        total,
        statusSum,
        difference: total - statusSum,
        possibleUnknownStatuses: tasks.filter(t => !['completed', 'in-progress', 'not-started', 'review', 'on-hold'].includes(normalizeStatus(t.status)))
      });
    }
    
    return { total, completed, inProgress, notStarted, review, onHold, overdue };
  }, [tasks]);

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    // Use the same normalization function
    const normalizeStatus = (status) => {
      if (!status) return 'not-started';
      const statusLower = status.toLowerCase();
      
      if (['completed', 'done', 'finished'].includes(statusLower)) return 'completed';
      if (['in-progress', 'in_progress', 'inprogress', 'active', 'working'].includes(statusLower)) return 'in-progress';
      if (['not-started', 'not_started', 'notstarted', 'todo', 'pending', 'new'].includes(statusLower)) return 'not-started';
      if (['review', 'in-review', 'in_review', 'reviewing'].includes(statusLower)) return 'review';
      if (['on-hold', 'on_hold', 'onhold', 'paused', 'blocked', 'cancelled'].includes(statusLower)) return 'on-hold';
      
      return 'not-started';
    };
    
    return {
      'not-started': filteredAndSortedTasks.filter(t => normalizeStatus(t.status) === 'not-started'),
      'in-progress': filteredAndSortedTasks.filter(t => normalizeStatus(t.status) === 'in-progress'),
      'review': filteredAndSortedTasks.filter(t => normalizeStatus(t.status) === 'review'),
      'on-hold': filteredAndSortedTasks.filter(t => normalizeStatus(t.status) === 'on-hold'),
      'completed': filteredAndSortedTasks.filter(t => normalizeStatus(t.status) === 'completed')
    };
  }, [filteredAndSortedTasks]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => 
      key !== 'assignee' && value !== ''
    );
  }, [filters]);

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

  // Loading state with professional design
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading your tasks...</h3>
              <p className="text-gray-600">Please wait while we fetch your task data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with professional design
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load tasks</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button onClick={fetchTasks} className="btn-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned to you</h3>
              <p className="text-gray-600">You have no tasks across all projects</p>
              <Link 
                to="/projects" 
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create New Task
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
              <p className="text-gray-600">
                Manage and track your assigned tasks across all projects
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link 
                to="/tasks/calendar" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendar View
              </Link>
              <Link 
                to="/projects" 
                className="inline-flex items-center px-4 py-2 bg-primary-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Task
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <TaskStatsDashboard stats={taskStats} />

        {/* Unified Container - Filter Panel + Task Content */}
        {filteredAndSortedTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Controls Panel */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200">
              {/* Left side - View toggle and filters */}
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setView('list')}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List View"
                  >
                    <ListBulletIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('board')}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      view === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Board View"
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('compact')}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      view === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Compact View"
                  >
                    <TableCellsIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-300"></div>

                {/* Filters */}
                <select
                  value={filters.project}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Status</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filters.dueDate}
                  onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Due Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Due Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="created">Sort: Created</option>
                  <option value="title">Sort: Title</option>
                </select>

                {/* Show Completed Toggle */}
                <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  Show Completed
                </label>
              </div>

              {/* Right side - Search and clear filters */}
              <div className="flex items-center gap-3">
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Clear
                  </button>
                )}

                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-48 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Empty State Content */}
            <div className="p-6">
              <TaskEmptyState
                hasNoTasks={tasks.length === 0}
                onResetFilters={resetFilters}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Controls Panel */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200">
              {/* Left side - View toggle and filters */}
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setView('list')}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="List View"
                  >
                    <ListBulletIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('board')}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      view === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Board View"
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('compact')}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                      view === 'compact' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Compact View"
                  >
                    <TableCellsIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-300"></div>

                {/* Filters */}
                <select
                  value={filters.project}
                  onChange={(e) => handleFilterChange('project', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Status</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filters.dueDate}
                  onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Due Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Due Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="created">Sort: Created</option>
                  <option value="title">Sort: Title</option>
                </select>

                {/* Show Completed Toggle */}
                <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  Show Completed
                </label>
              </div>

              {/* Right side - Search and clear filters */}
              <div className="flex items-center gap-3">
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Clear
                  </button>
                )}

                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-48 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Task Content */}
            {view === 'list' && (
              <TaskList
                tasks={filteredAndSortedTasks}
              />
            )}

            {view === 'board' && (
              <div className="p-6">
                <TaskBoard
                  tasksByStatus={tasksByStatus}
                />
              </div>
            )}

            {view === 'compact' && (
              <TaskList
                tasks={filteredAndSortedTasks}
                variant="compact"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
