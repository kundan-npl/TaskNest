import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import invitationService from '../../services/invitationService.js';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  UserIcon, 
  UserPlusIcon, 
  InformationCircleIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const InvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, login, register } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [processingAuth, setProcessingAuth] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Form data for authentication
  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  // Validate and load invitation
  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link: Missing token');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await invitationService.validateInvitation(token);
        
        if (response.success) {
          const { invitation: inviteData, userStatus, requiresAuth, authMode: suggestedAuthMode, isAuthenticated } = response.data;
          
          setInvitation(inviteData);
          setAuthMode(suggestedAuthMode);
          setAuthData(prev => ({
            ...prev,
            email: inviteData.email
          }));

          // If user is already authenticated and can accept directly
          if (isAuthenticated && !requiresAuth) {
            // Auto-accept for authenticated users
            await handleAcceptInvitation();
          }
        } else {
          setError(response.error || 'Invalid invitation');
        }
      } catch (err) {
        setError(err.message || 'Failed to validate invitation');
      } finally {
        setLoading(false);
      }
    };

    validateInvitation();
  }, [token]);

  // Handle countdown and redirect after success
  useEffect(() => {
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && redirectCountdown === 0) {
      navigate(`/projects/${invitation?.projectId}`);
    }
  }, [success, redirectCountdown, navigate, invitation]);

  // Handle authentication form submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setProcessingAuth(true);
    setError(null);

    try {
      // Validate form data
      if (authMode === 'register') {
        if (!authData.name.trim()) {
          throw new Error('Name is required');
        }
        if (authData.password !== authData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (authData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
      }

      // Perform authentication
      if (authMode === 'register') {
        await register({
          name: authData.name,
          email: authData.email,
          password: authData.password
        });
        toast.success('Account created successfully!');
      } else {
        await login(authData.email, authData.password);
        toast.success('Logged in successfully!');
      }

      // After successful auth, accept the invitation
      await handleAcceptInvitation();
    } catch (err) {
      setError(err.message || `${authMode === 'register' ? 'Registration' : 'Login'} failed`);
      toast.error(err.message);
    } finally {
      setProcessingAuth(false);
    }
  };

  // Handle invitation acceptance
  const handleAcceptInvitation = async () => {
    try {
      const response = await invitationService.respondToInvitation(token, 'accept');
      
      if (response.success) {
        setSuccess(true);
        setInvitation(prev => ({
          ...prev,
          ...response.data
        }));
        toast.success(response.message);
      } else {
        throw new Error(response.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  // Handle invitation decline
  const handleDeclineInvitation = async () => {
    if (!window.confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      const response = await invitationService.respondToInvitation(token, 'decline');
      
      if (response.success) {
        toast.success('Invitation declined');
        navigate('/');
      } else {
        throw new Error(response.error || 'Failed to decline invitation');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAuthData(prev => ({ ...prev, [name]: value }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to the Team! 🎉</h1>
          
          <p className="text-gray-600 mb-6">
            You have successfully joined <strong>{invitation?.projectName}</strong> as a{' '}
            <span className="capitalize font-medium text-blue-600">
              {invitationService.getRoleDisplayName(invitation?.role)}
            </span>.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Redirecting to your project in <strong>{redirectCountdown}</strong> seconds...
            </p>
          </div>
          
          <button 
            onClick={() => navigate(`/projects/${invitation?.projectId}`)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium mb-3 flex items-center justify-center"
          >
            Go to Project Now
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
          
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main invitation acceptance flow
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Project Invitation</h1>
          <p className="text-blue-100">You've been invited to collaborate</p>
        </div>

        <div className="px-6 py-6">
          
          {/* Invitation Details */}
          {invitation && (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-semibold text-gray-900">{invitation.projectName}</p>
                  <p className="text-sm text-gray-500">
                    As a {invitationService.getRoleDisplayName(invitation.role)}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>{invitation.invitedBy?.name || 'Project Manager'}</strong> has invited you to join this project.
                </p>
                {invitation.invitedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Invited on {new Date(invitation.invitedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <strong className="font-bold">Error: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Required */}
          {currentUser ? (
            // User is logged in - show accept/decline buttons
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 text-sm">
                      You're signed in as <strong>{currentUser.email}</strong>
                    </p>
                    <p className="text-green-700 text-xs mt-1">
                      Ready to join the project!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAcceptInvitation}
                  disabled={processingAuth}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Accept Invitation
                </button>
                
                <button
                  onClick={handleDeclineInvitation}
                  disabled={processingAuth}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            // User needs to authenticate
            <div>
              {/* Auth Mode Toggle */}
              <div className="mb-6">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => { setAuthMode('login'); setError(null); }}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                      authMode === 'login' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    Sign In
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setError(null); }}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                      authMode === 'register' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Create Account
                  </button>
                </div>

                {/* Information Banner */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                    <p className="text-blue-800 text-sm">
                      {authMode === 'login' 
                        ? `Sign in with ${invitation?.email} to accept this invitation.`
                        : `Create your account with ${invitation?.email} to join the project.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={authData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={authData.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This email is from the invitation and cannot be changed.</p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={authData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                    placeholder={authMode === 'register' ? 'Create a password (min. 6 characters)' : 'Enter your password'}
                  />
                </div>

                {authMode === 'register' && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={authData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Confirm your password"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processingAuth}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
                >
                  {processingAuth ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    authMode === 'register' ? 'Create Account & Join' : 'Sign In & Join'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By proceeding, you agree to join the project and collaborate with the team.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
