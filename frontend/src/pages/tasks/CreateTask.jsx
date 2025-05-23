import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import { useAuth } from '../../context/AuthContext.jsx';

const CreateTask = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not-started',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    subtasks: []
  });
  
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, we would fetch data from the API
      // const project = await projectService.getProjectById(projectId);
      // const members = await projectService.getProjectMembers(projectId);
      
      // For now, let's use mock data
      const mockProject = {
        id: projectId,
        name: 'TaskNest Frontend Development'
      };
      
      const mockMembers = [
        { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=1' },
        { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=2' },
        { id: '3', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=3' }
      ];
      
      setProject(mockProject);
      setMembers(mockMembers);
    } catch (error) {
      toast.error(error.message || 'Failed to load project data');
      navigate(`/projects/${projectId}`);
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
      
      // Validate form
      if (!formData.title.trim()) {
        toast.error('Task title is required');
        return;
      }
      
      if (!formData.dueDate) {
        toast.error('Due date is required');
        return;
      }
      
      // In a real implementation, we would call the API
      // await taskService.createTask(projectId, formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Task created successfully');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create task');
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
        <h1 className="text-2xl font-bold text-gray-800">Create New Task</h1>
        {project && (
          <p className="text-gray-600">
            Project: {project.name}
          </p>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-input w-full"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title"
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
                placeholder="Describe the task and its requirements..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  className="form-input w-full"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  className="form-input w-full"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                className="form-input w-full"
                value={formData.assignedTo}
                onChange={handleChange}
              >
                <option value="">Unassigned</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Subtasks
                </label>
                <span className="text-xs text-gray-500">
                  {formData.subtasks.length} subtasks
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Add a subtask..."
                    className="form-input w-full rounded-r-none"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-primary-600 text-white font-medium rounded-r-md hover:bg-primary-700 focus:outline-none"
                    onClick={handleAddSubtask}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {formData.subtasks.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">No subtasks added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`subtask-${index}`}
                          checked={subtask.completed}
                          onChange={() => {
                            const updatedSubtasks = [...formData.subtasks];
                            updatedSubtasks[index] = { ...subtask, completed: !subtask.completed };
                            setFormData({ ...formData, subtasks: updatedSubtasks });
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label 
                          htmlFor={`subtask-${index}`}
                          className={`ml-3 block text-sm font-medium ${
                            subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                          }`}
                        >
                          {subtask.title}
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}`)}
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
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
