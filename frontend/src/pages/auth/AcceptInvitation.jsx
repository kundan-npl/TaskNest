import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import { CheckCircleIcon, ExclamationTriangleIcon, UserIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentUser, login, register } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  
  // Auth form data for new users
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const projectId = searchParams.get('project');

  useEffect(() => {
    if (!token || !projectId) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    checkInvitation();
  }, [token, projectId]);

  useEffect(() => {
    // Auto-redirect countdown when successful
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (success && redirectCountdown === 0) {
      navigate(`/projects/${projectId}`);
    }
  }, [success, redirectCountdown, navigate, projectId]);

  const checkInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/projects/accept-invitation/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({ projectId })
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.requiresAuth) {
          setNeedsAuth(true);
          setInvitation(data.data);
          setAuthMode(data.data.authMode || 'login');
          setAuthData(prev => ({ 
            ...prev, 
            email: data.data.invitationEmail || '' 
          }));
        } else {
          // User is authenticated and successfully joined
          setSuccess(true);
          setInvitation(data.data);
          toast.success(data.message || 'Successfully joined the project!');
        }
      } else {
        setError(data.error || 'Invalid or expired invitation');
      }
    } catch (err) {
      setError('Failed to process invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      setAccepting(true);
      
      // If user is authenticated, accept invitation directly
      if (currentUser) {
        await checkInvitation();
        return;
      }

      // If user needs to authenticate first
      if (authMode === 'register') {
        if (authData.password !== authData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        
        if (authData.password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          return;
        }

        // Register the user
        await register({
          name: authData.name,
          email: authData.email,
          password: authData.password
        });

        toast.success('Account created successfully! Joining the project...');
      } else {
        // Login the user
        await login(authData.email, authData.password);
        toast.success('Login successful! Joining the project...');
      }

      // After authentication, accept the invitation
      setTimeout(() => {
        checkInvitation();
      }, 1000);

    } catch (err) {
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to the Team! 🎉</h1>
          
          {invitation?.confirmationMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm font-medium">
                {invitation.confirmationMessage}
              </p>
            </div>
          )}
          
          <p className="text-gray-600 mb-6">
            You have successfully joined <strong>{invitation?.project?.title}</strong> as a{' '}
            <span className="capitalize font-medium text-blue-600">{invitation?.role}</span>.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Redirecting to your project in <strong>{redirectCountdown}</strong> seconds...
            </p>
          </div>
          
          <button 
            onClick={() => navigate(`/projects/${projectId}`)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium mb-3"
          >
            Go to Project Now
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

  if (needsAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">T</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Invitation</h1>
            <p className="text-gray-600">
              You've been invited to join <strong>{invitation.projectName}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Role: <span className="font-medium capitalize text-blue-600">{invitation.role}</span>
            </p>
          </div>

          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                  authMode === 'login' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                {invitation.userExists ? 'Sign In' : 'Have Account?'}
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                  authMode === 'register' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlusIcon className="w-4 h-4" />
                {!invitation.userExists ? 'Create Account' : 'New Account?'}
              </button>
            </div>
            
            {invitation.userExists && authMode === 'login' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  ✓ Account found for <strong>{invitation.invitationEmail}</strong>
                </p>
              </div>
            )}
            
            {!invitation.userExists && authMode === 'register' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✓ Create your account to join the project
                </p>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleAcceptInvitation(); }} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={authData.name}
                  onChange={handleAuthChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={authData.email}
                onChange={handleAuthChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={invitation.userExists}
                placeholder="Enter your email address"
              />
              {invitation.userExists && authMode === 'login' && (
                <p className="text-xs text-gray-500 mt-1">Email is pre-filled from invitation</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={authData.password}
                onChange={handleAuthChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
                placeholder={authMode === 'register' ? 'Create a password (min. 6 characters)' : 'Enter your password'}
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={authData.confirmPassword}
                  onChange={handleAuthChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={accepting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {accepting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Join Project & ${authMode === 'register' ? 'Create Account' : 'Sign In'}`
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By accepting this invitation, you agree to join the project and collaborate with the team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Project!</h1>
        <p className="text-gray-600 mb-6">You have successfully joined the project.</p>
        <button 
          onClick={() => navigate(`/projects/${projectId}`)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Project
        </button>
      </div>
    </div>
  );
};

export default AcceptInvitation;
