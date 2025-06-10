import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import { useAuth } from '../../context/AuthContext.jsx';
import { getPermissions } from '../../utils/projectHelpers';
import { 
  PlusIcon, 
  TrashIcon, 
  CalendarIcon, 
  FlagIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const CreateTask = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  
  // Status options matching backend
  const statusOptions = [
    { value: 'todo', label: '🚀 Not Started' },
    { value: 'in-progress', label: '⚡ In Progress' },
    { value: 'review', label: '📝 In Review' },
    { value: 'done', label: '✅ Completed' },
    { value: 'cancelled', label: '❌ Cancelled' }
  ];

  // Allow assigning to multiple members
  // Change assignedTo to an array
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: dateParam || '',
    assignedTo: [], // now an array
    projectId: projectId || '',
    subtasks: []
  });
  
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    } else {
      fetchAllProjects();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // Fetch project data and members from the API
      const [projectData, membersData] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getProjectMembers(projectId)
      ]);
      
      setProject(projectData);
      setMembers(membersData);
      
      // Check user permissions for this project
      if (projectData.members) {
        // Use the correct user ID field - try both _id and id
        const userId = currentUser._id || currentUser.id;
        const userMember = projectData.members.find(member => {
          const memberUserId = member.user._id || member.user.id || member.user;
          return memberUserId === userId;
        });
        
        if (userMember) {
          setUserRole(userMember.role);
          const userPermissions = getPermissions(userMember.role);
          setPermissions(userPermissions);
          
          // Check if user can create tasks
          if (!userPermissions.canCreateTasks) {
            toast.error('You do not have permission to create tasks in this project');
            navigate(`/projects/${projectId}`);
            return;
          }
        } else {
          toast.error('You are not a member of this project');
          navigate(`/projects/${projectId}`);
          return;
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load project data');
      navigate(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch all projects from the API
      const projectsData = await projectService.getAllProjects();
      
      // For task creation when no specific project is selected, we'll use an empty members array
      // Members will be fetched when a project is selected
      setProjects(projectsData);
      setMembers([]);
    } catch (error) {
      toast.error(error.message || 'Failed to load projects');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));

    // If project is changed, fetch the members for the selected project
    if (name === 'projectId' && value) {
      fetchProjectMembers(value);
    } else if (name === 'projectId' && !value) {
      setMembers([]);
    }
  };

  const fetchProjectMembers = async (selectedProjectId) => {
    try {
      const membersData = await projectService.getProjectMembers(selectedProjectId);
      setMembers(membersData);
    } catch (error) {
      toast.error(error.message || 'Failed to load project members');
      setMembers([]);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    
    setFormData(prevState => ({
      ...prevState,
      subtasks: [...prevState.subtasks, { title: newSubtask.trim(), completed: false }]
    }));
    
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index) => {
    setFormData(prevState => ({
      ...prevState,
      subtasks: prevState.subtasks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Check permissions before submitting
      if (permissions && !permissions.canCreateTasks) {
        toast.error('You do not have permission to create tasks');
        return;
      }
      
      // If assigning task to someone, check assignment permissions
      if (formData.assignedTo && permissions && !permissions.canAssignTasks) {
        toast.error('You do not have permission to assign tasks');
        return;
      }
      
      // Validate form
      if (!formData.title.trim()) {
        toast.error('Task title is required');
        return;
      }
      
      if (!formData.projectId) {
        toast.error('Please select a project');
        return;
      }
      
      if (!formData.dueDate) {
        toast.error('Due date is required');
        return;
      }
      
      let status = formData.status;
      if (status === 'not-started') status = 'todo';
      if (status === 'completed') status = 'done';
      
      // Send assignedTo as array
      await taskService.createTask(formData.projectId, { ...formData, status, assignedTo: formData.assignedTo });
      
      toast.success('Task created successfully');
      
      // Navigate based on the source
      if (projectId) {
        navigate(`/projects/${projectId}`);
      } else {
        navigate('/tasks');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => projectId ? navigate(`/projects/${projectId}`) : navigate('/tasks')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 text-gray-600 hover:text-blue-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
                  <p className="text-gray-600 mt-1">
                    {project ? `Adding task to ${project.name}` : 'Create a new task and assign it to a project'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {dateParam && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-blue-800 font-medium">Pre-selected Due Date</p>
                <p className="text-blue-600 text-sm">
                  {new Date(dateParam).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <ClipboardDocumentListIcon className="h-6 w-6" />
              <span>Task Details</span>
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Project Selection - Only show if no projectId in URL */}
              {!projectId && (
                <div className="space-y-2">
                  <label htmlFor="projectId" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <UserGroupIcon className="h-4 w-4 text-blue-500" />
                    <span>Project *</span>
                  </label>
                  <select
                    id="projectId"
                    name="projectId"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    value={formData.projectId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Task Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <SparklesIcon className="h-4 w-4 text-purple-500" />
                  <span>Task Title *</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white text-lg font-medium"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive task title..."
                  required
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-green-500" />
                  <span>Description</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the task objectives, requirements, and any important details..."
                ></textarea>
              </div>
              
              {/* Status, Priority, Due Date Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="status" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                    <span>Status</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="priority" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <FlagIcon className="h-4 w-4 text-red-500" />
                    <span>Priority</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-orange-500" />
                    <span>Due Date *</span>
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    value={formData.dueDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              
              {/* Assigned To - Only show if user has assignment permissions */}
              {(!permissions || permissions.canAssignTasks) && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <UserGroupIcon className="h-4 w-4 text-indigo-500" />
                    <span>Assigned To</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {members.map(member => {
                      const memberId = member.user._id || member.user.id || member.user;
                      const checked = formData.assignedTo.includes(memberId);
                      return (
                        <label
                          key={memberId}
                          className={`inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded-full text-xs cursor-pointer shadow-sm hover:bg-indigo-50 transition-all max-w-none whitespace-nowrap ${checked ? 'ring-2 ring-indigo-400' : ''}`}
                          style={{ minWidth: '120px', maxWidth: '220px' }}
                          title={member.user.name}
                        >
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-indigo-600 mr-1 accent-indigo-600"
                            checked={checked}
                            onChange={e => {
                              setFormData(prev => {
                                const assignedTo = checked
                                  ? prev.assignedTo.filter(id => id !== memberId)
                                  : [...prev.assignedTo, memberId];
                                return { ...prev, assignedTo };
                              });
                            }}
                          />
                          <span className="font-medium overflow-hidden text-ellipsis" style={{maxWidth: '120px', display: 'inline-block', whiteSpace: 'nowrap', verticalAlign: 'middle'}}>{member.user.name}</span>
                          <span className="ml-1 text-gray-400 font-normal">({member.role})</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Assign to one or more team members</p>
                </div>
              )}
              
              {/* Subtasks Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-teal-500" />
                    <span>Subtasks</span>
                  </label>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-teal-50 rounded-full">
                    <span className="text-xs font-medium text-teal-700">
                      {formData.subtasks.length} subtasks
                    </span>
                  </div>
                </div>
                
                {/* Add Subtask Input */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Add a new subtask..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                    />
                    <button
                      type="button"
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 shadow-md hover:shadow-lg"
                      onClick={handleAddSubtask}
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
                
                {/* Subtasks List */}
                {formData.subtasks.length === 0 ? (
                  <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No subtasks added yet</p>
                    <p className="text-gray-400 text-sm">Break down your task into smaller, manageable pieces</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.subtasks.map((subtask, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            id={`subtask-${index}`}
                            checked={subtask.completed}
                            onChange={() => {
                              const updatedSubtasks = [...formData.subtasks];
                              updatedSubtasks[index] = { ...subtask, completed: !subtask.completed };
                              setFormData({ ...formData, subtasks: updatedSubtasks });
                            }}
                            className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded transition-all duration-200"
                          />
                          <label 
                            htmlFor={`subtask-${index}`}
                            className={`ml-4 flex-1 text-sm font-medium cursor-pointer transition-all duration-200 ${
                              subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700 hover:text-gray-900'
                            }`}
                          >
                            {subtask.title}
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(index)}
                          className="flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => projectId ? navigate(`/projects/${projectId}`) : navigate('/tasks')}
                className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    <span>Create Task</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;
