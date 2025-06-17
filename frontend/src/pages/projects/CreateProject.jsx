import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext.jsx';
import ProjectFormHeader from '../../components/projects/ProjectFormHeader.jsx';
import ProjectBasicInfo from '../../components/projects/ProjectBasicInfo.jsx';
import ProjectTags from '../../components/projects/ProjectTags.jsx';
import EnhancedMemberManagement from '../../components/projects/EnhancedMemberManagement.jsx';
import ProjectSettings from '../../components/projects/ProjectSettings.jsx';
import ProjectFormActions from '../../components/projects/ProjectFormActions.jsx';

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
  const [errors, setErrors] = useState({});
  const [inviteEmails, setInviteEmails] = useState([]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Project deadline is required';
    } else if (new Date(formData.deadline) < new Date(formData.startDate)) {
      newErrors.deadline = 'Deadline cannot be before start date';
    } else if (new Date(formData.deadline) < new Date()) {
      newErrors.deadline = 'Deadline cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare project data for API
      const projectData = {
        ...formData,
        createdBy: currentUser.id,
        members: [
          { user: currentUser.id, role: 'supervisor' },
          ...formData.members
        ]
        // Do NOT include inviteEmails here
      };
      
      const result = await projectService.createProject(projectData);
      // Send invites for each email in EnhancedMemberManagement
      if (inviteEmails && inviteEmails.length > 0) {
        for (const invite of inviteEmails) {
          try {
            await projectService.inviteMember(result._id, {
              email: invite.email,
              role: invite.role
            });
            toast.success(`Invitation sent to ${invite.email}`);
          } catch (err) {
            toast.error(`Failed to invite ${invite.email}: ${err.message}`);
          }
        }
      }
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <ProjectFormHeader 
          title="Create New Project"
          subtitle="Set up a new project with team members and settings"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <ProjectBasicInfo 
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
          
          <ProjectTags 
            formData={formData}
            tagInput={tagInput}
            setTagInput={setTagInput}
            handleAddTag={handleAddTag}
            handleRemoveTag={handleRemoveTag}
          />
          
          <EnhancedMemberManagement 
            formData={formData}
            availableUsers={availableUsers}
            loadingUsers={loadingUsers}
            handleMemberToggle={handleMemberToggle}
            handleMemberRoleChange={handleMemberRoleChange}
            inviteEmails={inviteEmails}
            setInviteEmails={setInviteEmails}
          />
          
          <ProjectSettings 
            formData={formData}
            handleChange={handleChange}
          />
          
          <ProjectFormActions 
            onCancel={() => navigate('/projects')}
            onSubmit={handleSubmit}
            submitting={submitting}
            isValid={Object.keys(errors).length === 0 && formData.title && formData.description && formData.deadline}
          />
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
