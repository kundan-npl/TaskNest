import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import { CheckCircleIcon, ExclamationTriangleIcon, UserIcon, UserPlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentUser, login, register } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false); // For auth form submission
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({
    name: '',
    email: '', // Will be pre-filled and disabled
    password: '',
    confirmPassword: ''
  });

  const projectId = searchParams.get('project');

  const checkInvitation = useCallback(async () => {
    if (!token || !projectId) {
      setError('Invalid invitation link: Missing token or project ID.');
      setLoading(false);
      toast.error('Invalid invitation link.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const currentAuthToken = localStorage.getItem('token');
      const response = await fetch(`/api/v1/projects/accept-invitation/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentAuthToken && { 'Authorization': `Bearer ${currentAuthToken}` })
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
            name: '',
            password: '',
            confirmPassword: '',
            email: data.data.invitationEmail || ''
          }));
        } else {
          // User is authenticated and successfully joined (or auto-accepted)
          setSuccess(true);
          setInvitation(data.data); // Contains redirectTo, project, role
          toast.success(data.message || 'Successfully joined the project!');
        }
      } else {
        setError(data.error || 'Invalid or expired invitation. Please check the link or contact the project owner.');
        toast.error(data.error || 'Invalid or expired invitation.');
      }
    } catch (err) {
      setError('Failed to process invitation. Please try again later.');
      toast.error('Failed to process invitation: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  }, [token, projectId, currentUser]); // currentUser dependency removed as token is explicitly fetched

  useEffect(() => {
    checkInvitation();
  }, [checkInvitation]); // checkInvitation is memoized

  useEffect(() => {
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && redirectCountdown === 0) {
      if (invitation && invitation.redirectTo) {
        navigate(invitation.redirectTo);
      } else if (invitation && invitation.project && invitation.project._id) {
        navigate(`/projects/${invitation.project._id}`);
      } else if (projectId) { // Fallback if project._id not in invitation for some reason
         navigate(`/projects/${projectId}`);
      }else {
        navigate('/dashboard'); // Absolute fallback
      }
    }
  }, [success, redirectCountdown, navigate, projectId, invitation]);

  const handleAuthFormSubmit = async (e) => {
    e.preventDefault();
    setAccepting(true);
    setError(null);

    try {
      // Step 1: Perform Authentication (Login or Register)
      if (authMode === 'register') {
        if (authData.password !== authData.confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (authData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await register({
          name: authData.name,
          email: authData.email, // This is the pre-filled invitationEmail
          password: authData.password
        });
        toast.success('Account created successfully! Finalizing invitation...');
      } else { // authMode === 'login'
        await login(authData.email, authData.password); // Email is pre-filled
        toast.success('Login successful! Finalizing invitation...');
      }

      // Step 2: Finalize Invitation (re-call checkInvitation which will now use the new token)
      // The AuthContext's login/register should have updated localStorage and currentUser.
      // The useEffect listening to currentUser (if any) or a direct call can now proceed.
      // For robustness, we explicitly re-check/re-submit the invitation.
      // Give a brief moment for AuthContext to fully update if needed, though ideally it's synchronous for token.
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for context update if any async behavior in AuthContext
      
      setLoading(true); // Show loading for the final API call
      const currentToken = localStorage.getItem('token');

      if (!currentToken) {
        throw new Error("Authentication session not found. Please try logging in again.");
      }

      const finalizeResponse = await fetch(`/api/v1/projects/accept-invitation/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ projectId })
      });
      const finalizeData = await finalizeResponse.json();
      setLoading(false);

      if (finalizeData.success && !finalizeData.data.requiresAuth) {
        setSuccess(true);
        setInvitation(finalizeData.data);
        toast.success(finalizeData.message || 'Successfully joined the project!');
        setNeedsAuth(false); 
      } else {
         const finalizeError = finalizeData.error || 'Failed to finalize invitation after authentication. The invitation might be invalid, already used, or for a different account.';
        setError(finalizeError);
        toast.error(finalizeError);
        if (finalizeData.data && finalizeData.data.requiresAuth) { // Still requires auth, maybe different user issue
            setNeedsAuth(true);
            setInvitation(prev => ({...prev, ...finalizeData.data}));
            setAuthMode(finalizeData.data.authMode || 'login');
            setAuthData(prev => ({ ...prev, password: '', confirmPassword: ''})); // Reset passwords
        }
      }

    } catch (authError) {
      const errorMessage = authError.response?.data?.error || authError.message || `Failed to ${authMode}. Please check your credentials or try again.`;
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false); // Ensure loading is off if auth fails before finalize step
    } finally {
      setAccepting(false);
    }
  };

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthData(prev => ({ ...prev, [name]: value }));
  };

  if (loading && !needsAuth) { // Show full page loader only on initial load
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !needsAuth) { // Show full page error if not in auth flow
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h1>
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
          
          {invitation?.project?.title && invitation?.role && (
             <p className="text-gray-600 mb-6">
              You have successfully joined <strong>{invitation.project.title}</strong> as a{' '}
              <span className="capitalize font-medium text-blue-600">{invitation.role}</span>.
            </p>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Redirecting to your project in <strong>{redirectCountdown}</strong> seconds...
            </p>
          </div>
          
          <button 
            onClick={() => {
              if (invitation && invitation.redirectTo) navigate(invitation.redirectTo);
              else if (invitation && invitation.project && invitation.project._id) navigate(`/projects/${invitation.project._id}`);
              else if (projectId) navigate(`/projects/${projectId}`);
              else navigate('/dashboard');
            }}
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
              <span className="text-3xl font-bold text-blue-600">TN</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Invitation</h1>
            {invitation?.projectName && (
              <p className="text-gray-600">
                You've been invited to join <strong>{invitation.projectName}</strong>
              </p>
            )}
            {invitation?.role && (
              <p className="text-sm text-gray-500 mt-1">
                As a: <span className="font-medium capitalize text-blue-600">{invitation.role}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

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
            
            {invitation?.userExists && authMode === 'login' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <p className="text-blue-800 text-sm">
                  An account already exists for <strong>{invitation.invitationEmail}</strong>. Please sign in to accept.
                </p>
              </div>
            )}
             {!invitation?.userExists && authMode === 'register' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                 <InformationCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <p className="text-green-800 text-sm">
                  Create your account with <strong>{invitation.invitationEmail}</strong> to join the project.
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleAuthFormSubmit} className="space-y-4">
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
                  onChange={handleAuthInputChange}
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
                readOnly // More appropriate than disabled for form submission
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-not-allowed"
                required
                aria-readonly="true"
              />
              <p className="text-xs text-gray-500 mt-1">This email is from the invitation and cannot be changed.</p>
            </div>

            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={authData.password}
                onChange={handleAuthInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
                placeholder={authMode === 'register' ? 'Create a password (min. 6 characters)' : 'Enter your password'}
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={authData.confirmPassword}
                  onChange={handleAuthInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={accepting || loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
            >
              {accepting || loading ? (
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
      </div>
    );
  }

  // Fallback if no other state matches (should ideally not be reached if logic is correct)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Preparing invitation...</p>
    </div>
  );
};

export default AcceptInvitation;
