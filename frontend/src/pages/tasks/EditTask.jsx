import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const EditTask = () => {
  const { id: taskId, projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [isProjectTask, setIsProjectTask] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assignedTo: [],
    assignedToUsers: [], // Store user objects for display
    projectId: projectId || '',
    subtasks: []
  });
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const task = await taskService.getTaskByIdSimple(taskId);
        console.log('[EditTask] Loaded task data:', task);
        
        // Ensure assignedTo is properly handled - fix for object vs ID format
        let assignedToIds = [];
        let assignedToUsers = []; // Keep user objects for display
        if (task.assignedTo && Array.isArray(task.assignedTo)) {
          assignedToIds = task.assignedTo.map(user => {
            // Handle different formats: could be user objects (from getTaskByIdSimple) or just IDs
            if (typeof user === 'string') return user;
            const userId = user._id || user.id || user;
            // Store user object for display purposes
            if (typeof user === 'object' && user.name) {
              assignedToUsers.push(user);
            }
            return userId;
          });
        }
        
        console.log('[EditTask] Original task status:', task.status);
        
        // Map backend status to frontend form values
        let formStatus = task.status || 'todo';
        if (formStatus === 'not-started') formStatus = 'todo';
        if (formStatus === 'completed') formStatus = 'done';
        if (formStatus === 'on-hold') formStatus = 'cancelled';
        // Keep 'in-progress' and 'review' as they are
        
        console.log('[EditTask] Mapped form status:', formStatus);
        
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: formStatus,
          priority: task.priority || 'medium',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          assignedTo: assignedToIds,
          assignedToUsers: assignedToUsers, // Store user objects for display
          projectId: task.projectId || '',
          subtasks: task.subtasks || []
        });
        if (task.projectId) {
          setIsProjectTask(true);
          fetchProjectData(task.projectId);
        } else {
          setIsProjectTask(false);
          fetchAllProjects();
        }
      } catch (error) {
        toast.error('Failed to load task');
        navigate('/tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
    // eslint-disable-next-line
  }, [taskId]);

  const fetchProjectData = async (projId) => {
    try {
      setLoading(true);
      const [projectData, membersData] = await Promise.all([
        projectService.getProjectById(projId),
        projectService.getProjectMembers(projId)
      ]);
      setProject(projectData);
      setMembers(membersData);
      if (projectData.members) {
        const userId = currentUser._id || currentUser.id;
        const userMember = projectData.members.find(member => {
          const memberUserId = member.user._id || member.user.id || member.user;
          return memberUserId === userId;
        });
        if (userMember) {
          setUserRole(userMember.role);
          setPermissions(getPermissions(userMember.role));
        }
      }
    } catch (error) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData);
      setMembers([]);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      toast.error('Failed to load project members');
      setMembers([]);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, { title: newSubtask.trim(), completed: false }] }));
    setNewSubtask('');
  };

  const handleRemoveSubtask = (index) => {
    setFormData(prev => ({ ...prev, subtasks: prev.subtasks.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (!formData.title.trim()) {
        toast.error('Task title is required');
        return;
      }
      if (!formData.dueDate) {
        toast.error('Due date is required');
        return;
      }
      
      // Prepare submit data while preserving assignments
      let status = formData.status;
      if (status === 'todo') status = 'todo'; // Keep as is
      if (status === 'not-started') status = 'todo'; // Handle legacy mapping
      if (status === 'done') status = 'done'; // Keep as is
      if (status === 'completed') status = 'done'; // Handle legacy mapping
      if (status === 'cancelled') status = 'cancelled'; // Keep as is
      // 'in-progress' and 'review' stay as they are
      
      // Only include assignedTo in the update if it has been explicitly changed
      // For read-only assignment display, we don't want to accidentally clear assignments
      const submitData = { 
        ...formData, 
        status
        // Note: assignedTo is intentionally excluded from updates to preserve existing assignments
        // Assignment changes should be handled through dedicated assignment management UI
      };
      
      console.log('[EditTask] Submitting task update with data:', submitData);
      console.log('[EditTask] Assignment preservation - NOT sending assignedTo to preserve existing assignments');
      
      await taskService.updateTask(formData.projectId, taskId, submitData);
      toast.success('Task updated successfully');
      
      if (formData.projectId) {
        navigate(`/projects/${formData.projectId}`);
      } else {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('[EditTask] Error updating task:', error);
      toast.error('Failed to update task: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => formData.projectId ? navigate(`/projects/${formData.projectId}`) : navigate('/tasks')}
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
                  <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
                </div>
              </div>
              <p className="text-gray-600 mt-1">
                {project ? `Editing task in ${project.name}` : 'Edit your task details'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <ClipboardDocumentListIcon className="h-6 w-6" />
              <span>Task Details</span>
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Title */}
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
                    <option value="todo">🚀 Not Started</option>
                    <option value="in-progress">⚡ In Progress</option>
                    <option value="review">📝 In Review</option>
                    <option value="done">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
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
              {/* Assigned To - Always visible but read-only */}
              {isProjectTask && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <UserGroupIcon className="h-4 w-4 text-indigo-500" />
                    <span>Assigned To</span>
                  </label>
                  {formData.assignedTo && formData.assignedTo.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // First, try to use the stored user objects from task data
                        let assignedUsersToDisplay = [];
                        
                        if (formData.assignedToUsers && formData.assignedToUsers.length > 0) {
                          // Use stored user objects from task data
                          assignedUsersToDisplay = formData.assignedToUsers.map(user => ({
                            user: user,
                            role: 'Member' // Default role since we don't have project membership info
                          }));
                        } else {
                          // Fallback to filtering from project members
                          assignedUsersToDisplay = members.filter(member => {
                            const memberId = member.user._id || member.user.id || member.user;
                            return formData.assignedTo.includes(memberId);
                          });
                        }
                        
                        return assignedUsersToDisplay.map((member, index) => {
                          const memberId = member.user._id || member.user.id || member.user;
                          const userName = member.user.name || 'Unknown User';
                          const userRole = member.role || 'Member';
                          
                          return (
                            <div
                              key={memberId || index}
                              className="inline-flex items-center px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-sm shadow-sm"
                              title={userName}
                            >
                              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                              <span className="font-medium text-indigo-700">{userName}</span>
                              <span className="ml-1 text-indigo-500 font-normal">({userRole})</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                      <span className="italic">No users assigned to this task</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 italic">
                    Task assignments are preserved during updates. Contact project admin to change assignments.
                  </p>
                </div>
              )}
              
              {/* Personal Tasks - Show different message for non-project tasks */}
              {!isProjectTask && (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <UserGroupIcon className="h-4 w-4 text-gray-500" />
                    <span>Assignment</span>
                  </label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <span className="font-medium">Personal Task</span> - This task is not part of a project and is assigned to you.
                  </div>
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
                      onChange={e => setNewSubtask(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
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
                            className={`ml-4 flex-1 text-sm font-medium cursor-pointer transition-all duration-200 ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700 hover:text-gray-900'}`}
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
                onClick={() => formData.projectId ? navigate(`/projects/${formData.projectId}`) : navigate('/tasks')}
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
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    <span>Update Task</span>
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

export default EditTask;
