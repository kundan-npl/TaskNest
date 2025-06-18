import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  FlagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasEditPermission, setHasEditPermission] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'planning',
    priorityLevel: 'medium',
  });
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Warn user about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (hasUnsavedChanges) {
      const draftKey = `project-edit-draft-${id}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
      setLastSaved(new Date());
    }
  }, [formData, hasUnsavedChanges, id]);

  // Load draft from localStorage on component mount
  useEffect(() => {
    const draftKey = `project-edit-draft-${id}`;
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft && !loading) {
      try {
        const draft = JSON.parse(savedDraft);
        // Only load draft if it's different from original data
        if (JSON.stringify(draft) !== JSON.stringify(originalData)) {
          const shouldLoadDraft = window.confirm(
            'A draft of your changes was found. Would you like to restore it?'
          );
          
          if (shouldLoadDraft) {
            setFormData(draft);
            setHasUnsavedChanges(true);
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      } catch (error) {
        console.error('Failed to parse draft:', error);
        localStorage.removeItem(draftKey);
      }
    }
  }, [loading, originalData, id]);
  
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // Fetch actual project data from the API
      const project = await projectService.getProjectById(id);
      
      // Check if user has permission to edit this project
      const userRole = project.members?.find(m => 
        (m.user._id || m.user.id || m.user) === (currentUser._id || currentUser.id)
      )?.role;
      
      const canEdit = userRole === 'supervisor' || userRole === 'team-lead' || hasRole('admin');
      setHasEditPermission(canEdit);
      
      if (!canEdit) {
        toast.error('You do not have permission to edit this project');
        navigate(`/projects/${id}`);
        return;
      }
      
      const projectData = {
        name: project.name || project.title || '',
        description: project.description || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : (project.deadline ? project.deadline.split('T')[0] : ''),
        status: project.status || 'planning',
        priorityLevel: project.priorityLevel || 'medium',
      };
      
      setFormData(projectData);
      setOriginalData(projectData);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error(error.message || 'Failed to load project data');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);
    
    // Check if there are unsaved changes
    const hasChanges = JSON.stringify(newFormData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    try {
      setSubmitting(true);
      
      // Validate form
      const newErrors = {};
      
      if (!formData.name.trim()) {
        newErrors.name = 'Project name is required';
      }
      
      if (!formData.description.trim()) {
        newErrors.description = 'Project description is required';
      }
      
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required';
      }
      
      if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date cannot be before start date';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error('Please fix the form errors before submitting');
        return;
      }
      
      // Call the actual API to update the project
      const updateData = {
        name: formData.name.trim(),
        title: formData.name.trim(), // Some endpoints might expect 'title'
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        deadline: formData.endDate || null, // Some endpoints might expect 'deadline'
        status: formData.status,
        priorityLevel: formData.priorityLevel,
      };
      
      await projectService.updateProject(id, updateData);
      
      // Reset unsaved changes state
      setHasUnsavedChanges(false);
      setOriginalData(formData);
      
      // Clear draft from localStorage
      const draftKey = `project-edit-draft-${id}`;
      localStorage.removeItem(draftKey);
      
      toast.success('Project updated successfully');
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error(error.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      navigate(`/projects/${id}`);
    }
  };

  const confirmLeave = () => {
    setShowUnsavedWarning(false);
    navigate(`/projects/${id}`);
  };

  const cancelLeave = () => {
    setShowUnsavedWarning(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project details...</p>
        </div>
      </div>
    );
  }

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' }
  ];

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'active', label: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'on-hold', label: 'On Hold', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'completed', label: 'Completed', color: 'text-purple-600', bg: 'bg-purple-100' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleNavigateBack}
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
                  <h1 className="text-3xl font-bold text-gray-900">
                    Edit Project
                    {hasUnsavedChanges && (
                      <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Unsaved changes
                      </span>
                    )}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Update your project details and settings
                    {lastSaved && (
                      <span className="ml-2 text-xs text-green-600">
                        • Draft saved {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <DocumentTextIcon className="h-6 w-6" />
              <span>Project Information</span>
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Project Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                  <span>Project Name <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter a descriptive project name..."
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <DocumentTextIcon className="h-4 w-4 text-green-500" />
                  <span>Project Description <span className="text-red-500">*</span></span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Describe the project goals, scope, and key objectives..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                <p className="text-sm text-gray-500">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                    <span>Start Date <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                      errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="endDate" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-purple-500" />
                    <span>End Date</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                      errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                  <p className="text-xs text-gray-500">Leave blank for ongoing projects</p>
                </div>
              </div>

              {/* Priority and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="priorityLevel" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <FlagIcon className="h-4 w-4 text-orange-500" />
                    <span>Priority Level</span>
                  </label>
                  <div className="relative">
                    <select
                      id="priorityLevel"
                      name="priorityLevel"
                      value={formData.priorityLevel}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-gray-50 hover:bg-white transition-all duration-200"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span>Project Status</span>
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-gray-50 hover:bg-white transition-all duration-200"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Values Display */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-blue-500" />
                  <span>Project Summary</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Priority:</span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                      priorityOptions.find(p => p.value === formData.priorityLevel)?.bg || 'bg-gray-100'
                    } ${priorityOptions.find(p => p.value === formData.priorityLevel)?.color || 'text-gray-600'}`}>
                      {priorityOptions.find(p => p.value === formData.priorityLevel)?.label || 'Medium'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                      statusOptions.find(s => s.value === formData.status)?.bg || 'bg-gray-100'
                    } ${statusOptions.find(s => s.value === formData.status)?.color || 'text-gray-600'}`}>
                      {statusOptions.find(s => s.value === formData.status)?.label || 'Planning'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {formData.startDate && formData.endDate 
                        ? `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days`
                        : formData.startDate ? 'Ongoing' : 'Not set'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleNavigateBack}
                className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Update Project</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
                  <p className="text-sm text-gray-600">You have unsaved changes that will be lost.</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to leave this page? Your changes will be lost.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelLeave}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Stay on Page
                </button>
                <button
                  onClick={confirmLeave}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Leave Without Saving
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProject;
