import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';

// Import chart components
import TaskStatusChart from '../../components/charts/TaskStatusChart.jsx';
import TaskCompletionChart from '../../components/charts/TaskCompletionChart.jsx';
import RoleBasedStats from '../../components/dashboard/RoleBasedStats.jsx';

// Role constants - Updated to match backend systemRole values
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

const Dashboard = () => {
  const { currentUser, hasRole } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    onHold: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we would fetch data from the API
        // However, for this example we'll use mock data
        
        // Mock projects data
        const mockProjects = [
          {
            id: '1',
            name: 'TaskNest Frontend Development',
            description: 'Develop the UI components for TaskNest project management application',
            status: 'active',
            priority: 'high',
            progress: 65,
            dueDate: '2025-06-15',
            createdAt: '2025-04-10',
            tasks: {
              total: 18,
              completed: 12,
            },
            members: [
              { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' },
              { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' },
            ],
            manager: { id: '3', name: 'Shobha Sharma', avatar: 'https://i.pravatar.cc/150?img=3' }
          },
          {
            id: '2',
            name: 'TaskNest Backend API',
            description: 'Implement REST API endpoints for the TaskNest application',
            status: 'active',
            priority: 'high',
            progress: 40,
            dueDate: '2025-06-01',
            createdAt: '2025-04-05',
            tasks: {
              total: 15,
              completed: 6,
            },
            members: [
              { id: '4', name: 'Kundan Kumar', avatar: 'https://i.pravatar.cc/150?img=4' },
              { id: '5', name: 'Anna Lee', avatar: 'https://i.pravatar.cc/150?img=5' },
            ],
            manager: { id: '3', name: 'Shobha Sharma', avatar: 'https://i.pravatar.cc/150?img=3' }
          },
          {
            id: '3',
            name: 'TaskNest Database Design',
            description: 'Design and implement MongoDB schemas and relationships',
            status: 'completed',
            priority: 'medium',
            progress: 100,
            dueDate: '2025-05-15',
            createdAt: '2025-04-01',
            tasks: {
              total: 10,
              completed: 10,
            },
            members: [
              { id: '4', name: 'Kundan Kumar', avatar: 'https://i.pravatar.cc/150?img=4' },
              { id: '6', name: 'Kritanta ', avatar: 'https://i.pravatar.cc/150?img=6' },
            ],
            manager: { id: '3', name: 'Shobha Sharma', avatar: 'https://i.pravatar.cc/150?img=3' }
          }
        ];
        
        // Mock tasks data
        const mockTasks = [
          {
            id: '1',
            title: 'Design Dashboard Layout',
            description: 'Create wireframes and prototype for the main dashboard layout',
            status: 'completed',
            priority: 'high',
            dueDate: '2025-04-25',
            projectId: '1',
            projectName: 'TaskNest Frontend Development',
            assignedTo: { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' }
          },
          {
            id: '2',
            title: 'Implement User Authentication UI',
            description: 'Create login, register and forgot password pages with validation',
            status: 'completed',
            priority: 'high',
            dueDate: '2025-04-30',
            projectId: '1',
            projectName: 'TaskNest Frontend Development',
            assignedTo: { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' }
          },
          {
            id: '3',
            title: 'Build Project List Component',
            description: 'Create a component to display all projects with filtering and sorting options',
            status: 'in-progress',
            priority: 'medium',
            dueDate: '2025-05-10',
            projectId: '1',
            projectName: 'TaskNest Frontend Development',
            assignedTo: { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' }
          },
          {
            id: '4',
            title: 'Create Task Management Components',
            description: 'Build drag and drop task board, task details modal, and task creation form',
            status: 'in-progress',
            priority: 'high',
            dueDate: '2025-05-20',
            projectId: '1',
            projectName: 'TaskNest Frontend Development',
            assignedTo: { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' }
          },
          {
            id: '5',
            title: 'Implement REST API Authorization',
            description: 'Add JWT authentication middleware to protect API routes',
            status: 'completed',
            priority: 'high',
            dueDate: '2025-04-20',
            projectId: '2',
            projectName: 'TaskNest Backend API',
            assignedTo: { id: '4', name: 'Kundan Kumar', avatar: 'https://i.pravatar.cc/150?img=4' }
          },
          {
            id: '6',
            title: 'Design MongoDB Schema',
            description: 'Design and implement MongoDB schemas for users, projects, tasks',
            status: 'completed',
            priority: 'high',
            dueDate: '2025-04-15',
            projectId: '3',
            projectName: 'TaskNest Database Design',
            assignedTo: { id: '4', name: 'Kundan Kumar', avatar: 'https://i.pravatar.cc/150?img=4' }
          },
          {
            id: '7',
            title: 'Implement Project API Routes',
            description: 'Create CRUD routes for projects with proper validation',
            status: 'not-started',
            priority: 'medium',
            dueDate: '2025-05-25',
            projectId: '2',
            projectName: 'TaskNest Backend API',
            assignedTo: { id: '5', name: 'Anna Lee', avatar: 'https://i.pravatar.cc/150?img=5' }
          },
          {
            id: '8',
            title: 'Setup MongoDB Indexes',
            description: 'Create indexes for better query performance',
            status: 'on-hold',
            priority: 'low',
            dueDate: '2025-05-30',
            projectId: '3',
            projectName: 'TaskNest Database Design',
            assignedTo: { id: '6', name: 'Kritanta ', avatar: 'https://i.pravatar.cc/150?img=6' }
          }
        ];
        
        // Calculate task stats
        const total = mockTasks.length;
        const completed = mockTasks.filter(task => task.status === 'completed').length;
        const inProgress = mockTasks.filter(task => task.status === 'in-progress').length;
        const notStarted = mockTasks.filter(task => task.status === 'not-started').length;
        const onHold = mockTasks.filter(task => task.status === 'on-hold').length;
        
        // Generate mock weekly data for task completion chart
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const mockWeeklyData = days.map(day => {
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
        
        setProjects(mockProjects);
        setTasks(mockTasks);
        setTaskStats({
          total,
          completed,
          inProgress,
          notStarted,
          onHold
        });
        setWeeklyData(mockWeeklyData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Filter tasks that are assigned to the current user
  const userTasks = tasks.filter(task => 
    task.assignedTo && task.assignedTo.id === (currentUser?.id || 'unknown')
  );
  
  // Sort tasks by due date (ascending)
  const sortedTasks = [...userTasks].sort((a, b) => 
    new Date(a.dueDate) - new Date(b.dueDate)
  );
  
  // Filter overdue tasks
  const overdueTasks = sortedTasks.filter(task => 
    new Date(task.dueDate) < new Date() && task.status !== 'completed'
  );
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center">
          <p className="text-gray-600 mr-2">Welcome back, {currentUser?.name || 'User'}!</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
            ${(currentUser?.systemRole || currentUser?.role) === ROLES.ADMIN ? 'bg-purple-100 text-purple-800' : 
              'bg-green-100 text-green-800'}`}>
            {(currentUser?.systemRole || currentUser?.role) === ROLES.ADMIN ? 'System Admin' : 'User'}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            • Project roles vary by project
          </span>
        </div>
      </div>
      
      {/* Role-based Stats Section */}
      <div className="mb-6">
        <RoleBasedStats />
      </div>
      
      {/* Stats Overview - Shown to all users but with role-specific content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Project Stats - All users can see projects */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">My Projects</div>
              <div className="text-3xl font-bold text-gray-800">{projects.length}</div>
            </div>
            <div className="rounded-full bg-indigo-100 p-3">
              <svg className="w-6 h-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>
              <span className="text-xs font-medium text-green-500 bg-green-100 px-2 py-1 rounded-full">
                {projects.filter(p => p.status === 'active').length} Active
              </span>
            </div>
            <Link to="/projects" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          </div>
        </div>
        
        {/* Task Stats - All users can see tasks */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">My Tasks</div>
              <div className="text-3xl font-bold text-gray-800">{userTasks.length}</div>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <div>
              <span className="text-xs font-medium text-green-500 bg-green-100 px-2 py-1 rounded-full">
                {userTasks.length > 0 ? Math.round((userTasks.filter(t => t.status === 'completed').length / userTasks.length) * 100) : 0}% Complete
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {userTasks.filter(t => t.status === 'completed').length} of {userTasks.length}
            </span>
          </div>
        </div>
        
        {/* In Progress Tasks - All users see but with context */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">In Progress</div>
              <div className="text-3xl font-bold text-gray-800">{userTasks.filter(t => t.status === 'in-progress').length}</div>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <svg className="w-6 h-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-yellow-400 h-2.5 rounded-full" style={{ 
                width: userTasks.length > 0 
                  ? `${(userTasks.filter(t => t.status === 'in-progress').length / userTasks.length) * 100}%` 
                  : '0%' 
              }}></div>
            </div>
          </div>
        </div>
        
        {/* Overdue Tasks - All users see but with context */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">My Overdue Tasks</div>
              <div className="text-3xl font-bold text-gray-800">{overdueTasks.length}</div>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <svg className="w-6 h-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xs font-medium ${
              overdueTasks.length > 0 ? 'text-red-500 bg-red-100' : 'text-green-500 bg-green-100'
            } px-2 py-1 rounded-full`}>
              {overdueTasks.length > 0 
                ? `${overdueTasks.length} tasks need attention` 
                : 'All tasks on schedule'
              }
            </span>
          </div>
        </div>
      </div>
      
      {/* Charts and Tasks Sections - Different views based on role */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Charts - Left Column - Visible to all but with different data scope */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Status Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">My Task Status</h2>
            <TaskStatusChart taskStats={{
              total: userTasks.length,
              completed: userTasks.filter(t => t.status === 'completed').length,
              inProgress: userTasks.filter(t => t.status === 'in-progress').length,
              notStarted: userTasks.filter(t => t.status === 'not-started').length,
              onHold: userTasks.filter(t => t.status === 'on-hold').length
            }} />
          </div>
          
          {/* Weekly Task Completion */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">My Weekly Progress</h2>
            <TaskCompletionChart weeklyData={weeklyData} />
          </div>
          
          {/* Recent Projects - Different view based on role */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">My Recent Projects</h2>
              <Link to="/projects" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.slice(0, 3).map((project) => (
                    <tr 
                      key={project.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/projects/${project.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.status === 'active' ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                        ) : project.status === 'completed' ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Completed</span>
                        ) : project.status === 'on-hold' ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">On Hold</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{project.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="bg-primary-600 h-2.5 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(project.dueDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Upcoming and Overdue Tasks - Right Column */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Tasks</h2>
            
            {userTasks.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks assigned to you</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by joining a project team.
                </p>
              </div>
            ) : (
              <>
                {overdueTasks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-red-600 mb-2">Overdue Tasks</h3>
                    <div className="space-y-3">
                      {overdueTasks.map(task => (
                        <Link 
                          key={task.id}
                          to={`/tasks/${task.id}`}
                          className="block p-3 bg-red-50 hover:bg-red-100 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{task.title}</div>
                              <div className="text-xs text-gray-500">
                                {task.projectName} • Due {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              {task.status === 'in-progress' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">In Progress</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Not Started</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Upcoming Tasks</h3>
                  <div className="space-y-3">
                    {sortedTasks
                      .filter(task => !overdueTasks.includes(task) && task.status !== 'completed')
                      .slice(0, 5)
                      .map(task => (
                        <Link
                          key={task.id}
                          to={`/tasks/${task.id}`}
                          className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{task.title}</div>
                              <div className="text-xs text-gray-500">
                                {task.projectName} • Due {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              {task.status === 'in-progress' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">In Progress</span>
                              ) : task.status === 'not-started' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Not Started</span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">On Hold</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))
                    }
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recently Completed</h3>
                  <div className="space-y-3">
                    {sortedTasks
                      .filter(task => task.status === 'completed')
                      .slice(0, 3)
                      .map(task => (
                        <Link
                          key={task.id}
                          to={`/tasks/${task.id}`}
                          className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{task.title}</div>
                              <div className="text-xs text-gray-500">
                                {task.projectName}
                              </div>
                            </div>
                            <div>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    }
                  </div>
                </div>
              </>
            )}
            
            <div className="mt-6 text-center">
              <Link
                to="/tasks"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All Tasks
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* View Projects - All users */}
          <Link to="/projects" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="rounded-full bg-primary-100 p-3 mb-2">
              <svg className="w-6 h-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">View Projects</span>
          </Link>
          
          {/* My Tasks - All users */}
          <Link to="/tasks" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="rounded-full bg-blue-100 p-3 mb-2">
              <svg className="w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">My Tasks</span>
          </Link>
          
          {/* New Project - All users can create projects and become supervisors */}
          <Link to="/projects/create" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="rounded-full bg-green-100 p-3 mb-2">
              <svg className="w-6 h-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">New Project</span>
          </Link>
          
          {/* Calendar - All users */}
          <Link to="/tasks/calendar" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="rounded-full bg-purple-100 p-3 mb-2">
              <svg className="w-6 h-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">Calendar</span>
          </Link>
          
          {/* Profile - All users */}
          <Link to="/profile" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="rounded-full bg-yellow-100 p-3 mb-2">
              <svg className="w-6 h-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">Profile</span>
          </Link>
          
          {/* Settings - All users */}
          <Link to="/settings" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="rounded-full bg-gray-200 p-3 mb-2">
              <svg className="w-6 h-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">Settings</span>
          </Link>
          
          {/* User Management - Admin only */}
          {hasRole(['admin']) && (
            <Link to="/users" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <div className="rounded-full bg-indigo-100 p-3 mb-2">
                <svg className="w-6 h-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">User Management</span>
            </Link>
          )}
          
          {/* Reports - Admin only */}
          {hasRole(['admin']) && (
            <Link to="/reports" className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <div className="rounded-full bg-red-100 p-3 mb-2">
                <svg className="w-6 h-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">Reports</span>
            </Link>
          )}
        </div>
      </div>
      
      {/* Admin-only System Overview */}
      {hasRole(['admin']) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">System Health</h3>
                <div className="flex items-center">
                  <div className="rounded-full w-3 h-3 bg-green-500 mr-2"></div>
                  <span className="font-semibold text-gray-800">Excellent</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  All services operational
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Storage Usage</h3>
                <div className="flex items-center">
                  <span className="font-semibold text-gray-800">64%</span>
                  <span className="text-xs text-gray-500 ml-2">(512GB / 800GB)</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">User Activity</h3>
                <div className="font-semibold text-gray-800">18 active users</div>
                <div className="mt-2 text-xs text-gray-500">
                  Last 24 hours: 24 logins
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Recent System Events</h3>
                <button className="text-xs text-primary-600 hover:text-primary-800">
                  View All Events
                </button>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="rounded-full w-2 h-2 bg-green-500 mr-2"></div>
                    <span className="text-sm text-gray-800">Database backup completed</span>
                  </div>
                  <span className="text-xs text-gray-500">Today, 3:45 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="rounded-full w-2 h-2 bg-blue-500 mr-2"></div>
                    <span className="text-sm text-gray-800">System updates installed</span>
                  </div>
                  <span className="text-xs text-gray-500">Yesterday, 11:30 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="rounded-full w-2 h-2 bg-yellow-500 mr-2"></div>
                    <span className="text-sm text-gray-800">High CPU usage detected (resolved)</span>
                  </div>
                  <span className="text-xs text-gray-500">Yesterday, 2:12 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
