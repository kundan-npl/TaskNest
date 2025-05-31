import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext.jsx';

const CreateProject = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [submitting, setSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    status: 'planning',
    priorityLevel: 'medium',
    tags: [],
    members: [],
    settings: {
      allowMemberInvite: false,
      requireApprovalForTasks: false,
      enableNotifications: true,
      visibilityLevel: 'team'
    }
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await userService.getAllUsers();
      setAvailableUsers(users.filter(user => user._id !== currentUser?.id));
    } catch (error) {
      console.error('Error fetching users:', error);
      // Use mock data for development
      setAvailableUsers([
        { _id: 'u2', name: 'John Doe', email: 'john@tasknest.com', department: 'Development' },
        { _id: 'u3', name: 'Jane Smith', email: 'jane@tasknest.com', department: 'Design' },
        { _id: 'u4', name: 'Bob Johnson', email: 'bob@tasknest.com', department: 'QA' }
      ]);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prevState => ({
        ...prevState,
        [parent]: {
          ...prevState[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prevState => ({
        ...prevState,
        tags: [...prevState.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prevState => ({
      ...prevState,
      tags: prevState.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleMemberToggle = (userId, role = 'team-member') => {
    setFormData(prevState => {
      const existingMemberIndex = prevState.members.findIndex(m => m.user === userId);
      
      if (existingMemberIndex > -1) {
        return {
          ...prevState,
          members: prevState.members.filter(m => m.user !== userId)
        };
      } else {
        return {
          ...prevState,
          members: [...prevState.members, { user: userId, role }]
        };
      }
    });
  };

  const handleMemberRoleChange = (userId, newRole) => {
    setFormData(prevState => ({
      ...prevState,
      members: prevState.members.map(member => 
        member.user === userId 
          ? { ...member, role: newRole }
          : member
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Validate form
      if (!formData.title.trim()) {
        toast.error('Project title is required');
        return;
      }
      
      if (!formData.description.trim()) {
        toast.error('Project description is required');
        return;
      }
      
      if (!formData.deadline) {
        toast.error('Project deadline is required');
        return;
      }
      
      if (new Date(formData.deadline) < new Date(formData.startDate)) {
        toast.error('Deadline cannot be before start date');
        return;
      }

      if (new Date(formData.deadline) < new Date()) {
        toast.error('Deadline cannot be in the past');
        return;
      }
      
      // Prepare project data for API
      const projectData = {
        ...formData,
        createdBy: currentUser.id,
        members: [
          { user: currentUser.id, role: 'supervisor' },
          ...formData.members
        ]
      };
      
      const result = await projectService.createProject(projectData);
      
      toast.success('Project created successfully!');
      navigate(`/projects/${result._id}`);
      
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600 mt-2">Fill in the details to create a new project</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter project title"
              />
            </div>

            <div>
              <label htmlFor="priorityLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Priority Level *
              </label>
              <select
                id="priorityLevel"
                name="priorityLevel"
                value={formData.priorityLevel}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe your project..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Deadline *
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Team Members
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                You will automatically be added as the project supervisor. Select additional team members below:
              </p>
              
              {loadingUsers ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableUsers.map((user) => {
                    const isSelected = formData.members.some(m => m.user === user._id);
                    const memberData = formData.members.find(m => m.user === user._id);
                    
                    return (
                      <div key={user._id} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleMemberToggle(user._id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <select
                            value={memberData?.role || 'team-member'}
                            onChange={(e) => handleMemberRoleChange(user._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="team-member">Team Member</option>
                            <option value="team-lead">Team Lead</option>
                            <option value="supervisor">Supervisor</option>
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Project Settings
            </label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings.visibilityLevel" className="block text-sm font-medium text-gray-700 mb-1">
                    Visibility Level
                  </label>
                  <select
                    id="settings.visibilityLevel"
                    name="settings.visibilityLevel"
                    value={formData.settings.visibilityLevel}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="private">Private (Only project members)</option>
                    <option value="team">Team (Department visible)</option>
                    <option value="organization">Organization (Everyone can see)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="settings.allowMemberInvite"
                    name="settings.allowMemberInvite"
                    checked={formData.settings.allowMemberInvite}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="settings.allowMemberInvite" className="ml-2 text-sm text-gray-700">
                    Allow team members to invite others
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="settings.requireApprovalForTasks"
                    name="settings.requireApprovalForTasks"
                    checked={formData.settings.requireApprovalForTasks}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="settings.requireApprovalForTasks" className="ml-2 text-sm text-gray-700">
                    Require approval for task completion
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="settings.enableNotifications"
                    name="settings.enableNotifications"
                    checked={formData.settings.enableNotifications}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="settings.enableNotifications" className="ml-2 text-sm text-gray-700">
                    Enable notifications for this project
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
