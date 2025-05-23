import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import taskService from '../../services/taskService';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const TaskCalendar = () => {
  const { currentUser } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateTasksModalOpen, setDateTasksModalOpen] = useState(false);
  
  useEffect(() => {
    fetchTasks();
  }, [currentMonth]);
  
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Calculate first and last day of current month for filtering
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // In a real implementation, we would fetch data from the API with date filters
      // const tasks = await taskService.getAllTasks(`?startDate=${firstDay.toISOString()}&endDate=${lastDay.toISOString()}`);
      
      // For now, let's use mock data
      const mockTasks = [
        {
          id: '1',
          title: 'Implement Task Dashboard',
          projectId: '1',
          projectName: 'TaskNest Frontend',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2025-05-10',
          assignedTo: {
            id: '1',
            name: 'John Doe',
            avatar: 'https://i.pravatar.cc/150?img=1'
          }
        },
        {
          id: '2',
          title: 'Design User Flow',
          projectId: '1',
          projectName: 'TaskNest Frontend',
          status: 'completed',
          priority: 'medium',
          dueDate: '2025-05-05',
          assignedTo: {
            id: '2',
            name: 'Jane Smith',
            avatar: 'https://i.pravatar.cc/150?img=2'
          }
        },
        {
          id: '3',
          title: 'API Documentation',
          projectId: '2',
          projectName: 'TaskNest Backend',
          status: 'not-started',
          priority: 'low',
          dueDate: '2025-05-15',
          assignedTo: {
            id: '1',
            name: 'John Doe',
            avatar: 'https://i.pravatar.cc/150?img=1'
          }
        },
        {
          id: '4',
          title: 'User Testing',
          projectId: '1',
          projectName: 'TaskNest Frontend',
          status: 'not-started',
          priority: 'high',
          dueDate: '2025-05-25',
          assignedTo: {
            id: '3',
            name: 'Shobha Sharma',
            avatar: 'https://i.pravatar.cc/150?img=3'
          }
        },
        {
          id: '5',
          title: 'Bug Fixes',
          projectId: '2',
          projectName: 'TaskNest Backend',
          status: 'in-progress',
          priority: 'high',
          dueDate: '2025-05-18',
          assignedTo: {
            id: '2',
            name: 'Jane Smith',
            avatar: 'https://i.pravatar.cc/150?img=2'
          }
        }
      ];
      
      setTasks(mockTasks);
    } catch (error) {
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
    const dateString = date.toISOString().split('T')[0];
    
    return tasks.filter(task => task.dueDate === dateString);
  };
  
  // Handle day click
  const handleDayClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
    setDateTasksModalOpen(true);
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
                key={task.id} 
                className={`text-xs p-1 rounded truncate ${
                  task.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : task.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
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
      </div>
      
      {/* Date Tasks Modal */}
      {dateTasksModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Tasks for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <button 
                onClick={() => setDateTasksModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {getTasksForDay(selectedDate.getDate()).length > 0 ? (
                getTasksForDay(selectedDate.getDate()).map(task => (
                  <div key={task.id} className="border rounded-lg overflow-hidden">
                    <div className={`p-3 ${
                      task.status === 'completed' 
                        ? 'bg-green-100' 
                        : task.priority === 'high'
                        ? 'bg-red-100'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100'
                        : 'bg-blue-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <Link to={`/tasks/${task.id}`} className="font-medium hover:underline">
                          {task.title}
                        </Link>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'completed' 
                            ? 'bg-green-200 text-green-800' 
                            : task.status === 'in-progress'
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {task.status === 'in-progress' ? 'In Progress' : 
                          task.status === 'not-started' ? 'Not Started' : 
                          task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3">
                      <div className="text-sm text-gray-700 mb-2">
                        Project: <Link to={`/projects/${task.projectId}`} className="text-primary-600 hover:underline">{task.projectName}</Link>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">Assigned to:</span>
                          <div className="flex items-center">
                            <img 
                              src={task.assignedTo.avatar}
                              alt={task.assignedTo.name}
                              className="w-5 h-5 rounded-full mr-1"
                            />
                            <span>{task.assignedTo.name}</span>
                          </div>
                        </div>
                        <Link to={`/tasks/${task.id}`} className="text-primary-600 hover:underline">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No tasks scheduled for this date
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Link 
                to="/tasks/create" 
                className="btn-primary flex items-center"
              >
                <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendar;
