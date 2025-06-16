import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import taskService from '../../services/taskService';
import fileService from '../../services/fileService';
import { useAuth } from '../../context/AuthContext.jsx';
import FileUploader from '../../components/common/FileUploader';

const TaskDetails = () => {
  const { id: idFromParams } = useParams(); // Renamed for clarity
  const navigate = useNavigate();
  const { currentUser, hasRole } = useAuth();
  
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true); // Initial loading true
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [taskFiles, setTaskFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);

  useEffect(() => {
    const rawId = idFromParams;
    // Log raw idFromParams immediately
    console.log(`[TaskDetails] useEffect[idFromParams] - START. Raw idFromParams: "${rawId}", type: ${typeof rawId}`);

    // Trim rawId if it's a string, otherwise use as is
    const currentId = (typeof rawId === 'string') ? rawId.trim() : rawId;
    console.log(`[TaskDetails] useEffect[idFromParams] - Processed currentId: "${currentId}", type: ${typeof currentId}`);

    // Validate the processed currentId
    const isValidId = currentId && typeof currentId === 'string' && currentId !== "undefined" && currentId !== "";

    if (isValidId) {
      console.log(`[TaskDetails] useEffect[idFromParams] - ID is VALID: "${currentId}". Calling fetchTaskData.`);
      fetchTaskData(currentId);
    } else {
      console.warn(`[TaskDetails] useEffect[idFromParams] - ID is INVALID. currentId: "${currentId}" (type: ${typeof currentId}), rawId: "${rawId}". Redirecting to /projects.`);
      setLoading(false); // Stop loading before redirect
      if (navigate && typeof navigate === 'function') {
          navigate('/projects');
      } else {
          console.error("[TaskDetails] navigate function is not available for redirection!");
      }
    }
  }, [idFromParams, navigate]);

  useEffect(() => {
    const rawId = idFromParams;
    const currentId = (typeof rawId === 'string') ? rawId.trim() : rawId;
    
    // Ensure task is loaded AND currentId (processed route param) is valid and available
    const isValidIdForFiles = task && currentId && typeof currentId === 'string' && currentId !== "undefined" && currentId !== "";

    if (isValidIdForFiles) {
      console.debug(`[TaskDetails] useEffect[task,idFromParams]: Task and valid ID "${currentId}". Fetching files.`);
      fetchTaskFiles(currentId);
    } else if (task) {
      console.warn(`[TaskDetails] useEffect[task,idFromParams]: Task exists, but ID for files is invalid. currentId: "${currentId}" (type: ${typeof currentId}), rawId: "${rawId}".`);
    }
  }, [task, idFromParams]); // idFromParams is the dependency

  // Fetch comments when task is loaded
  useEffect(() => {
    const rawId = idFromParams;
    const currentId = (typeof rawId === 'string') ? rawId.trim() : rawId;
    const isValidId = currentId && typeof currentId === 'string' && currentId !== "undefined" && currentId !== "";
    if (isValidId) {
      fetchComments(currentId);
    }
  }, [task, idFromParams]);

  const fetchTaskData = async (taskIdArg) => {
    console.log(`[TaskDetails] fetchTaskData - START. Received taskIdArg: "${taskIdArg}", type: ${typeof taskIdArg}`);
    const currentTaskId = (typeof taskIdArg === 'string') ? taskIdArg.trim() : taskIdArg;
    console.log(`[TaskDetails] fetchTaskData - Processed currentTaskId: "${currentTaskId}", type: ${typeof currentTaskId}`);

    const isValidTaskId = currentTaskId && typeof currentTaskId === 'string' && currentTaskId !== "undefined" && currentTaskId !== "";

    if (!isValidTaskId) {
      console.warn(`[TaskDetails] fetchTaskData - Invalid currentTaskId: "${currentTaskId}" (type: ${typeof currentTaskId}), raw taskIdArg: "${taskIdArg}". Aborting data fetch.`);
      setLoading(false); // Ensure loading is stopped
      // Do not navigate from here; the main useEffect handles redirection based on idFromParams
      return;
    }

    console.log(`[TaskDetails] fetchTaskData - Task ID "${currentTaskId}" is VALID. Proceeding to fetch.`);
    try {
      setLoading(true);
      // console.debug('[TaskDetails] Fetching task data for id (arg):', currentTaskId); // Covered by new log

      // Use getTaskByIdSimple since we only have the task ID
      const taskData = await taskService.getTaskByIdSimple(currentTaskId);
      setTask(taskData);
      // Optionally clear comments if you want to hide the section
      setComments([]);
    } catch (error) {
      console.error('[TaskDetails] Error fetching task data:', error);
      toast.error(error.message || 'Failed to load task data');
      // Navigate only if the error is critical and related to the main data fetch
      // Check if idFromParams is still the problematic one to avoid loop if error is different
      if (taskIdArg === idFromParams) {
        if (navigate && typeof navigate === 'function') {
            navigate('/projects');
        } else {
            console.error("[TaskDetails] navigate function is not available for redirection in error handler!");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskFiles = async (taskIdArg) => {
    console.log(`[TaskDetails] fetchTaskFiles - START. Received taskIdArg: "${taskIdArg}", type: ${typeof taskIdArg}`);
    const currentTaskId = (typeof taskIdArg === 'string') ? taskIdArg.trim() : taskIdArg;
    console.log(`[TaskDetails] fetchTaskFiles - Processed currentTaskId: "${currentTaskId}", type: ${typeof currentTaskId}`);

    const isValidTaskId = currentTaskId && typeof currentTaskId === 'string' && currentTaskId !== "undefined" && currentTaskId !== "";

    if (!isValidTaskId) {
      console.warn(`[TaskDetails] fetchTaskFiles - Invalid currentTaskId: "${currentTaskId}" (type: ${typeof currentTaskId}), raw taskIdArg: "${taskIdArg}". Aborting file fetch.`);
      setLoadingFiles(false); // Ensure loading is stopped
      return;
    }
    
    console.log(`[TaskDetails] fetchTaskFiles - Task ID "${currentTaskId}" is VALID. Proceeding to fetch files.`);
    try {
      setLoadingFiles(true);
      // console.debug('[TaskDetails] Fetching task files for taskId:', currentTaskId); // Covered by new log
      const files = await fileService.listFiles({ taskId: currentTaskId });
      setTaskFiles(files);
    } catch (error) {
      console.error('Error fetching task files:', error);
      toast.error('Failed to load task files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchComments = async (taskIdArg) => {
    try {
      const currentTaskId = (typeof taskIdArg === 'string') ? taskIdArg.trim() : taskIdArg;
      const commentsData = await taskService.getTaskComments(currentTaskId);
      setComments(
        (commentsData || []).map(comment => ({
          id: comment._id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: comment.author
            ? {
                id: comment.author._id,
                name: comment.author.name,
                avatar: comment.author.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
              }
            : {
                id: '',
                name: 'Unknown',
                avatar: `https://i.pravatar.cc/150?img=1`
              }
        }))
      );
    } catch (error) {
      setComments([]);
      toast.error(error.message || 'Failed to load comments');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdating(true);
      
      // In a real implementation, we would call the API
      // await taskService.updateTaskStatus(id, newStatus);
      
      // Update local state
      setTask({ ...task, status: newStatus });
      toast.success('Task status updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update task status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      // await taskService.deleteTask(id);
      toast.success('Task deleted successfully');
      navigate(`/projects/${task.projectId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to delete task');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSubmittingComment(true);
      await taskService.addTaskComment(idFromParams, newComment);
      setNewComment('');
      toast.success('Comment added successfully');
      fetchComments(idFromParams);
    } catch (error) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId, completed) => {
    try {
      // In a real implementation, we would call the API
      // await taskService.updateSubtask(subtaskId, { completed });
      
      // Update local state
      const updatedSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed } : st
      );
      
      setTask({ ...task, subtasks: updatedSubtasks });
    } catch (error) {
      toast.error(error.message || 'Failed to update subtask');
    }
  };

  const handleFileUpload = async (files) => {
    try {
      setLoadingFiles(true);
      
      // In a real implementation, we would call the API
      // const uploadedFiles = await fileService.uploadFiles(files);
      
      // Simulate API response
      const uploadedFiles = files.map(file => ({
        id: `file-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file) // For preview purpose
      }));
      
      // Update local state
      setTaskFiles([...taskFiles, ...uploadedFiles]);
      toast.success('Files uploaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to upload files');
    } finally {
      setLoadingFiles(false);
      setShowFileUploader(false);
    }
  };

  const handleFileDownload = async (fileKey) => {
    if (!fileKey || fileKey === 'undefined') {
      console.error('[handleFileDownload] Invalid fileKey:', fileKey);
      toast.error('Invalid file key for download');
      return;
    }
    try {
      const downloadUrl = await fileService.getDownloadUrl(fileKey);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleFileDelete = async (fileKey) => {
    if (!fileKey || fileKey === 'undefined') {
      console.error('[handleFileDelete] Invalid fileKey:', fileKey);
      toast.error('Invalid file key for delete');
      return;
    }
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await fileService.deleteFile(fileKey);
        // Always pass the correct task ID
        fetchTaskFiles(idFromParams);
        toast.success('File deleted successfully');
      } catch (error) {
        console.error('Error deleting file:', error);
        toast.error('Failed to delete file');
      }
    }
  };

  const renderTaskStatus = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'in-progress':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">In Progress</span>;
      case 'not-started':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">Not Started</span>;
      case 'on-hold':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">On Hold</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const renderPriority = (priority) => {
    switch(priority) {
      case 'high':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">High</span>;
      case 'medium':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">Medium</span>;
      case 'low':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">Low</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">{priority}</span>;
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

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtasksProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Helper to get a valid file key/id
  const getFileKey = (file) => file.key || file.id || file._id || null;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <Link to={`/projects/${task.projectId}`} className="mr-4 text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
          </div>
          
          {hasRole(['admin', 'user']) && (
            <div className="flex gap-2">
              <Link
                to={`/tasks/${idFromParams}/edit`}
                className="btn-secondary"
              >
                Edit Task
              </Link>
              {confirmDelete ? (
                <>
                  <button
                    onClick={handleDeleteTask}
                    className="btn-danger"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="btn-danger"
                >
                  Delete Task
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          <Link to={`/projects/${task.projectId}`} className="hover:text-primary-600">
            {task.projectName}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Details - Left Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-700">Status:</span>
                {renderTaskStatus(task.status)}
              </div>
              
              {hasRole(['admin', 'user']) && (
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={task.status === 'not-started' || statusUpdating}
                    onClick={() => handleStatusChange('not-started')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      task.status === 'not-started'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Not Started
                  </button>
                  <button
                    disabled={task.status === 'in-progress' || statusUpdating}
                    onClick={() => handleStatusChange('in-progress')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      task.status === 'in-progress'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    disabled={task.status === 'completed' || statusUpdating}
                    onClick={() => handleStatusChange('completed')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      task.status === 'completed'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    disabled={task.status === 'on-hold' || statusUpdating}
                    onClick={() => handleStatusChange('on-hold')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      task.status === 'on-hold'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    On Hold
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <div className="text-xs text-gray-500">Priority</div>
                <div className="mt-1">{renderPriority(task.priority)}</div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <div className="text-xs text-gray-500">Due Date</div>
                <div className="mt-1 text-sm font-medium">{new Date(task.dueDate).toLocaleDateString()}</div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <div className="text-xs text-gray-500">Created On</div>
                <div className="mt-1 text-sm font-medium">{new Date(task.createdAt).toLocaleDateString()}</div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <div className="text-xs text-gray-500">Created By</div>
                <div className="mt-1 text-sm font-medium flex items-center">
                  <img 
                    src={task.createdBy.avatar}
                    alt={task.createdBy.name}
                    className="w-5 h-5 rounded-full mr-2"
                  />
                  {task.createdBy.name}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <div className="text-xs text-gray-500">Assigned To</div>
                <div className="mt-1 text-sm font-medium flex items-center">
                  {task.assignedTo ? (
                    <>
                      <img 
                        src={task.assignedTo.avatar}
                        alt={task.assignedTo.name}
                        className="w-5 h-5 rounded-full mr-2"
                      />
                      {task.assignedTo.name}
                    </>
                  ) : (
                    <span className="text-gray-500">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
            
            <h3 className="font-medium text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 mb-6">{task.description}</p>
            
            <h3 className="font-medium text-gray-800 mb-2">Subtasks</h3>
            <div className="mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{completedSubtasks} of {totalSubtasks} subtasks completed</span>
                <span className="text-xs font-medium text-gray-700">{subtasksProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full" 
                  style={{ width: `${subtasksProgress}%` }}
                ></div>
              </div>
              
              <div className="space-y-2">
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center bg-gray-50 p-3 rounded-md">
                    <input
                      type="checkbox"
                      id={`subtask-${subtask.id}`}
                      checked={subtask.completed}
                      onChange={() => handleSubtaskToggle(subtask.id, !subtask.completed)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label 
                      htmlFor={`subtask-${subtask.id}`}
                      className={`ml-3 block text-sm font-medium ${
                        subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}
                    >
                      {subtask.title}
                    </label>
                  </div>
                ))}
              </div>
              
              {hasRole(['admin', 'user']) && (
                <div className="mt-4">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Subtask
                  </button>
                </div>
              )}
            </div>
            
            {task.attachments && task.attachments.length > 0 && (
              <>
                <h3 className="font-medium text-gray-800 mb-2">Attachments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {task.attachments.map(attachment => (
                    <div key={attachment.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {attachment.type.startsWith('image/') ? (
                            <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 overflow-hidden">
                              <img 
                                src={attachment.url} 
                                alt={attachment.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {attachment.size}
                          </div>
                          <div className="mt-1">
                            <a 
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {hasRole(['admin', 'user']) && (
              <div className="mb-6">
                <button 
                  onClick={() => setShowFileUploader(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Upload Attachment
                </button>
                
                {showFileUploader && (
                  <div className="mt-4">
                    <FileUploader 
                      onUpload={handleFileUpload}
                      onClose={() => setShowFileUploader(false)}
                      multiple={true}
                      maxSize={50}
                      allowedTypes="pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif"
                      taskId={idFromParams}
                      projectId={task.projectId}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-medium text-gray-800 mb-4">Comments</h3>
            
            {comments.length === 0 ? (
              <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Be the first to share your thoughts on this task.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div className="flex items-start">
                        <img 
                          src={comment.user.avatar} 
                          alt={comment.user.name}
                          className="h-8 w-8 rounded-full mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {comment.user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Comment Actions Button (if needed) */}
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      {comment.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {hasRole(['admin', 'user']) && (
              <form onSubmit={handleCommentSubmit}>
                <div className="mb-4">
                  <textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    className="form-input w-full"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="btn-primary"
                  >
                    {submittingComment ? (
                      <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full"></div>
                    ) : (
                      'Post Comment'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        {/* Task Timeline - Right Column */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-medium text-gray-800 mb-4">Task Timeline</h3>
            
            <div className="relative pb-8">
              <div className="absolute inset-0 flex items-center justify-center h-full w-px bg-gray-200 left-[15px]"></div>
              
              <div className="relative space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-full border-4 border-white flex items-center justify-center">
                      <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Task Created</h4>
                    <p className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Created by {task.createdBy.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full border-4 border-white flex items-center justify-center">
                      <svg className="h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Task Assigned</h4>
                    <p className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Assigned to {task.assignedTo?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>
                
                {task.subtasks.filter(s => s.completed).length > 0 && (
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-yellow-100 rounded-full border-4 border-white flex items-center justify-center">
                        <svg className="h-4 w-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Subtasks Progress</h4>
                      <p className="text-xs text-gray-500">Ongoing</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {completedSubtasks} of {totalSubtasks} subtasks completed
                      </p>
                    </div>
                  </div>
                )}
                
                {task.status === 'completed' ? (
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-100 rounded-full border-4 border-white flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Task Completed</h4>
                      <p className="text-xs text-gray-500">Just now</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-100 rounded-full border-4 border-white flex items-center justify-center">
                        <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Due Date</h4>
                      <p className="text-xs text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</p>
                      {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                        <p className="text-sm text-red-600 mt-1">
                          Task is overdue!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Related Tasks - if needed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-medium text-gray-800 mb-4">Project Information</h3>
            
            <div className="space-y-4">
              <Link 
                to={`/projects/${task.projectId}`}
                className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{task.projectName}</div>
                    <div className="text-xs text-gray-500">View project details</div>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <Link 
                to={`/projects/${task.projectId}/tasks`}
                className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">All Project Tasks</div>
                    <div className="text-xs text-gray-500">View all tasks in this project</div>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Task description card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
          </div>
          
          {/* Task files card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Files</h2>
              <button 
                onClick={() => setShowFileUploader(!showFileUploader)} 
                className="btn-primary btn-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {showFileUploader ? 'Cancel' : 'Upload'}
              </button>
            </div>
            
            {showFileUploader && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                <FileUploader 
                  onUpload={handleFileUpload} 
                  multiple={true} 
                  maxSize={50}
                  allowedTypes="pdf,doc,docx,xls,xlsx,ppt,pptx,txt,jpg,jpeg,png,gif"
                  taskId={idFromParams}
                  projectId={task.projectId}
                />
              </div>
            )}
            
            {loadingFiles ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : taskFiles.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {taskFiles.map((file) => {
                  const fileKey = getFileKey(file);
                  console.log('[File Render] file:', file, 'fileKey:', fileKey);
                  if (!fileKey) return null;
                  return (
                    <div key={file.id || file._id || file.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 flex items-center justify-center rounded bg-gray-100 ${
                          file.contentType?.includes('image') ? 'bg-blue-50' :
                          file.contentType?.includes('pdf') ? 'bg-red-50' :
                          file.contentType?.includes('document') || file.contentType?.includes('msword') ? 'bg-blue-50' :
                          file.contentType?.includes('sheet') || file.contentType?.includes('excel') ? 'bg-green-50' :
                          'bg-gray-50'
                        }`}>
                          {file.contentType?.includes('image') ? (
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          ) : file.contentType?.includes('pdf') ? (
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(file.createdAt).toLocaleDateString()} • {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleFileDownload(fileKey)}
                          className="p-1 text-gray-600 hover:text-primary-600"
                          title="Download"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleFileDelete(fileKey)}
                          className="p-1 text-gray-600 hover:text-red-600"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="mt-2 text-sm text-gray-500">File sharing is coming soon!</p>
                <p className="text-xs text-gray-400">This feature is under development.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          {/* Activity log or related information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-medium text-gray-800 mb-4">Activity Log</h3>
            
            <div className="space-y-4">
              {/* Example log item */}
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-100 rounded-full border-4 border-white flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Task status updated</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
              
              {/* More log items... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
