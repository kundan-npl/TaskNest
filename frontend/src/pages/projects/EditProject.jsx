import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import { useAuth } from '../../context/AuthContext.jsx';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: '',
  });
  
  useEffect(() => {
    fetchProjectData();
  }, [id]);
  
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, we would fetch data from the API
      // const project = await projectService.getProjectById(id);
      
      // For now, let's use mock data
      const mockProject = {
        id,
        name: 'TaskNest Frontend Development',
        description: 'Develop the frontend for TaskNest application using React, Vite, and TailwindCSS.',
        startDate: '2025-01-15',
        endDate: '2025-06-30',
        status: 'active',
      };
      
      setFormData({
        name: mockProject.name,
        description: mockProject.description,
        startDate: mockProject.startDate,
        endDate: mockProject.endDate || '',
        status: mockProject.status,
      });
    } catch (error) {
      toast.error(error.message || 'Failed to load project data');
      navigate('/projects');
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Validate form
      if (!formData.name.trim()) {
        toast.error('Project name is required');
        return;
      }
      
      if (!formData.startDate) {
        toast.error('Start date is required');
        return;
      }
      
      if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
        toast.error('End date cannot be before start date');
        return;
      }
      
      // In a real implementation, we would call the API
      // await projectService.updateProject(id, formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Project updated successfully');
      navigate(`/projects/${id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };
  
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
        <h1 className="text-2xl font-bold text-gray-800">Edit Project</h1>
        <p className="text-gray-600">
          Project ID: {id}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input w-full"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter project name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="form-input w-full"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the project and its goals..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="form-input w-full"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="form-input w-full"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                />
                <p className="mt-1 text-xs text-gray-500">Leave blank for ongoing projects</p>
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="form-input w-full"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                'Update Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject;
