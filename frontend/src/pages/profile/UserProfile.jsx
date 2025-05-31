import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';

const UserProfile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    bio: '',
    role: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        avatar: currentUser.avatar || '',
        bio: currentUser.bio || '',
        role: currentUser.role || ''
      });
    }
  }, [currentUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form
      if (!formData.name.trim()) {
        toast.error('Name is required');
        return;
      }
      
      // In a real implementation, we would call the API
      // await updateUserProfile(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form
      if (!passwordData.currentPassword) {
        toast.error('Current password is required');
        return;
      }
      
      if (!passwordData.newPassword) {
        toast.error('New password is required');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (passwordData.newPassword.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      
      // In a real implementation, we would call the API
      // await updateUserPassword(passwordData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Password updated successfully');
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // This is a simplified version. In a real app, you'd upload the file to a server
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, avatar: event.target.result });
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
            
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input w-full"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input w-full bg-gray-100"
                    value={formData.email}
                    readOnly
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    className="form-input w-full"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell others about yourself..."
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    System Role
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    className="form-input w-full bg-gray-100"
                    value={formData.role === 'admin' ? 'System Administrator' : formData.role === 'manager' ? 'Manager' : 'Team Member'}
                    readOnly
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your project-specific roles may vary by project
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
            
            <form onSubmit={handlePasswordUpdate}>
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    className="form-input w-full"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    className="form-input w-full"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-input w-full"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Project Roles Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Project Roles</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your roles across different projects. These determine your permissions within each project.
            </p>
            
            {/* Mock project roles data */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">TaskNest Frontend Development</h3>
                    <p className="text-sm text-gray-500">Active project • Due June 15, 2025</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Supervisor
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Full project control, can manage all aspects including members and settings
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">TaskNest Backend API</h3>
                    <p className="text-sm text-gray-500">Active project • Due June 1, 2025</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Team Lead
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Can manage tasks, assign work, and coordinate team activities
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">TaskNest Database Design</h3>
                    <p className="text-sm text-gray-500">Completed project • Completed May 15, 2025</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Team Member
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Can work on assigned tasks and collaborate with team
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Role Definitions</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div><strong>Supervisor:</strong> Full project control and member management</div>
                <div><strong>Team Lead:</strong> Task management and team coordination</div>
                <div><strong>Team Member:</strong> Task execution and collaboration</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Avatar and Stats */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Picture</h2>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-gray-100">
                {formData.avatar ? (
                  <img 
                    src={formData.avatar} 
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <label 
                htmlFor="avatar-upload" 
                className="btn-secondary cursor-pointer inline-block"
              >
                Change Photo
              </label>
              <input 
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              
              <p className="text-xs text-gray-500 mt-2">
                Recommended: Square image, 500x500 pixels or larger
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Statistics</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Account Created</div>
                <div className="font-medium">May 10, 2025</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Projects</div>
                <div className="font-medium">7 projects</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Tasks Assigned</div>
                <div className="font-medium">24 tasks</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Completed Tasks</div>
                <div className="font-medium">19 tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
