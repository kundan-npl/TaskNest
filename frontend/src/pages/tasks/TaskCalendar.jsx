import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import { formatLocalDateYYYYMMDD } from '../../utils/dateUtils.js';

const TaskCalendar = () => {
  const { currentUser } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchTasks();
  }, [currentMonth]);
  
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Calculate first and last day of current month for filtering
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      console.log('[TaskCalendar] Fetching tasks for date range:', {
        firstDay: firstDay.toISOString(),
        lastDay: lastDay.toISOString()
      });
      
      // Fetch tasks from all sources
      const allTasks = [];
      
      // 1. Fetch personal tasks first
      try {
        const personalTasks = await taskService.getPersonalTasks();
        console.log('[TaskCalendar] Found personal tasks:', personalTasks?.length);
        
        if (Array.isArray(personalTasks) && personalTasks.length > 0) {
          // Filter personal tasks with due dates in current month
          const monthlyPersonalTasks = personalTasks
            .filter(task => {
              if (!task.dueDate) return false;
              
              let taskDueDate;
              if (typeof task.dueDate === 'string') {
                if (task.dueDate.includes('T')) {
                  taskDueDate = new Date(task.dueDate);
                } else {
                  taskDueDate = new Date(task.dueDate + 'T00:00:00');
                }
              } else {
                taskDueDate = new Date(task.dueDate);
              }
              
              return taskDueDate >= firstDay && taskDueDate <= lastDay;
            })
            .map(task => ({
              ...task,
              projectId: null,
              projectName: 'Personal Tasks',
              assignedTo: Array.isArray(task.assignedTo) && task.assignedTo.length > 0 
                ? task.assignedTo[0].user || task.assignedTo[0] 
                : null
            }));
          
          console.log(`[TaskCalendar] Found ${monthlyPersonalTasks.length} personal tasks for this month`);
          allTasks.push(...monthlyPersonalTasks);
        }
      } catch (personalTaskError) {
        console.error('[TaskCalendar] Error fetching personal tasks:', personalTaskError);
        // Continue with project tasks even if personal tasks fail
      }
      
      // 2. Fetch all projects for the user
      const projects = await projectService.getAllProjects();
      console.log('[TaskCalendar] Found projects:', projects?.length);
      
      if (projects && projects.length > 0) {
        // 3. Fetch tasks from all user's projects
        for (const project of projects) {
          try {
            const projectTasks = await taskService.getProjectTasks(project._id);
          
          if (Array.isArray(projectTasks)) {
            // Filter tasks that are assigned to the current user and have due dates in this month
            const userTasks = projectTasks
              .filter(task => {
                // Check if task is assigned to current user
                const isAssignedToMe = Array.isArray(task.assignedTo) && 
                  task.assignedTo.some(a => (a.user?._id || a.user) === currentUser._id);
                
                // Check if task has a due date within the current month
                if (!task.dueDate) return false;
                
                let taskDueDate;
                if (typeof task.dueDate === 'string') {
                  if (task.dueDate.includes('T')) {
                    // Full ISO string - parse it
                    taskDueDate = new Date(task.dueDate);
                  } else {
                    // YYYY-MM-DD format - parse it
                    taskDueDate = new Date(task.dueDate + 'T00:00:00');
                  }
                } else {
                  // Already a Date object
                  taskDueDate = new Date(task.dueDate);
                }
                
                const hasDueDateInMonth = taskDueDate >= firstDay && taskDueDate <= lastDay;
                
                return isAssignedToMe && hasDueDateInMonth;
              })
              .map(task => ({
                ...task,
                projectId: project._id,
                projectName: project.name || project.title,
                // Ensure we have the assignee info for display
                assignedTo: Array.isArray(task.assignedTo) && task.assignedTo.length > 0 
                  ? task.assignedTo[0].user || task.assignedTo[0] 
                  : null
              }));
            
            console.log(`[TaskCalendar] Found ${userTasks.length} tasks for user in project ${project.name} for this month`);
            allTasks.push(...userTasks);
          }
          } catch (err) {
            console.error(`[TaskCalendar] Error fetching tasks for project ${project.name}:`, err);
            continue;
          }
        }
      }
      
      console.log('[TaskCalendar] Total tasks for calendar:', allTasks.length);
      setTasks(allTasks);
    } catch (error) {
      console.error('[TaskCalendar] Error fetching tasks:', error);
      toast.error(error.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };
  
  // Get days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  // Get day of week for the first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  // Navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentMonth(new Date());
  };
  
  // Get formatted month and year
  const getMonthYearString = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Get tasks for a specific day
  const getTasksForDay = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = formatLocalDateYYYYMMDD(date);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      // Handle both date string formats and Date objects
      let taskDueDate;
      if (typeof task.dueDate === 'string') {
        if (task.dueDate.includes('T')) {
          // Full ISO string - extract just the date part
          taskDueDate = task.dueDate.split('T')[0];
        } else {
          // Already in YYYY-MM-DD format
          taskDueDate = task.dueDate;
        }
      } else {
        // Date object
        taskDueDate = formatLocalDateYYYYMMDD(new Date(task.dueDate));
      }
      
      return taskDueDate === dateString;
    });
  };
  
  // Handle day click
  const handleDayClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    navigate(`/tasks/create?date=${formatLocalDateYYYYMMDD(date)}`);
  };
  
  // Render calendar
  const renderCalendar = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="border bg-gray-50"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const dayTasks = getTasksForDay(day);
      
      days.push(
        <div 
          key={day} 
          className={`border p-1 min-h-[100px] relative ${
            isToday ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => handleDayClick(day)}
        >
          <div className={`absolute top-1 right-1 flex items-center justify-center rounded-full w-6 h-6 text-sm ${
            isToday ? 'bg-primary-600 text-white' : 'text-gray-700'
          }`}>
            {day}
          </div>
          
          <div className="pt-6 space-y-1">
            {dayTasks.slice(0, 3).map((task) => (
              <div 
                key={task._id} 
                className={`text-xs p-1 rounded truncate cursor-pointer ${
                  task.status === 'done' 
                    ? 'bg-green-100 text-green-800' 
                    : task.priorityLevel === 'high'
                    ? 'bg-red-100 text-red-800'
                    : task.priorityLevel === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
                title={`${task.title} - ${task.projectName} (${task.status})`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/tasks/${task._id}`);
                }}
              >
                {task.title}
              </div>
            ))}
            
            {dayTasks.length > 3 && (
              <div className="text-xs text-gray-500 px-1">
                +{dayTasks.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Task Calendar</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold">{getMonthYearString()}</h2>
            
            <button
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={goToToday}
              className="btn-secondary"
            >
              Today
            </button>
            
            <Link to="/tasks/create" className="btn-primary">
              Add Task
            </Link>
          </div>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center font-medium bg-gray-100">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px">
            {renderCalendar()}
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-red-100 mr-2"></div>
            <span className="text-sm">High Priority</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-yellow-100 mr-2"></div>
            <span className="text-sm">Medium Priority</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-blue-100 mr-2"></div>
            <span className="text-sm">Low Priority</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-100 mr-2"></div>
            <span className="text-sm">Completed</span>
          </div>
        </div>
        
        {/* Task Summary */}
        {tasks.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              This Month: {tasks.length} tasks
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                Done: {tasks.filter(t => t.status === 'done').length}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                In Progress: {tasks.filter(t => t.status === 'in-progress').length}
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                Review: {tasks.filter(t => t.status === 'review').length}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                To Do: {tasks.filter(t => t.status === 'todo').length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCalendar;
