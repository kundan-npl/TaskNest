import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import TaskStatsDashboard from '../../components/tasks/TaskStatsDashboard.jsx';
import TaskFilters from '../../components/tasks/TaskFilters.jsx';
import TaskViewControls from '../../components/tasks/TaskViewControls.jsx';
import TaskList from '../../components/tasks/TaskList.jsx';
import TaskBoard from '../../components/tasks/TaskBoard.jsx';
import TaskEmptyState from '../../components/tasks/TaskEmptyState.jsx';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';

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
  }, [currentUser]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Fetch all projects for the user
      const projects = await projectService.getAllProjects();
      if (!projects || projects.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // 2. For each project, fetch its tasks
      const allTasks = [];
      for (const project of projects) {
        try {
          const projectTasks = await taskService.getProjectTasks(project._id);
          if (Array.isArray(projectTasks)) {
            // 3. Filter for tasks assigned to the current user (fix: use assignedTo array)
            const myTasks = projectTasks.filter(
              (task) => Array.isArray(task.assignedTo) && task.assignedTo.some(a => (a.user?._id || a.user) === currentUser._id)
            );
            allTasks.push(...myTasks);
          }
        } catch (err) {
          // Optionally handle per-project errors
          continue;
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

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => 
      key !== 'assignee' && value !== ''
    );
  }, [filters]);

  // Handle bulk operations
  const handleBulkStatusUpdate = async (newStatus) => {
    if (newStatus === 'clear') {
      setSelectedTasks(new Set());
      return;
    }

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
      toast.success(`Updated ${selectedTasks.size} tasks to ${newStatus.replace('-', ' ')}`);
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

        {/* Filters Section */}
        <TaskFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          projects={projects}
          onResetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
          showCompleted={showCompleted}
          onToggleCompleted={setShowCompleted}
        />

        {/* View Controls and Bulk Actions */}
        <TaskViewControls
          view={view}
          onViewChange={setView}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          selectedTasks={selectedTasks}
          onBulkAction={handleBulkStatusUpdate}
          onSelectAll={handleSelectAll}
          filteredTasksCount={filteredAndSortedTasks.length}
          allSelected={selectedTasks.size === filteredAndSortedTasks.length}
        />

        {/* Task Content */}
        {filteredAndSortedTasks.length === 0 ? (
          <TaskEmptyState
            hasNoTasks={tasks.length === 0}
            onResetFilters={resetFilters}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {view === 'list' && (
              <TaskList
                tasks={filteredAndSortedTasks}
                selectedTasks={selectedTasks}
                onTaskSelection={handleTaskSelection}
              />
            )}

            {view === 'board' && (
              <div className="p-6">
                <TaskBoard
                  tasksByStatus={tasksByStatus}
                  selectedTasks={selectedTasks}
                  onTaskSelection={handleTaskSelection}
                />
              </div>
            )}

            {view === 'compact' && (
              <TaskList
                tasks={filteredAndSortedTasks}
                selectedTasks={selectedTasks}
                onTaskSelection={handleTaskSelection}
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
