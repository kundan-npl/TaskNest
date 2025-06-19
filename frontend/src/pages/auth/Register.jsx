import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({
    google: false,
    microsoft: false,
    github: false
  });
  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();

  const { name, email, password, passwordConfirm } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    // Check required fields
    if (!name || !email || !password || !passwordConfirm) {
      toast.error('Please fill in all required fields');
      return false;
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Validate password strength
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    // Check if passwords match
    if (password !== passwordConfirm) {
      toast.error('Passwords do not match. Please check and try again');
      return false;
    }

    return true;
  };

  const validatePassword = () => {
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    if (password !== passwordConfirm) {
      toast.error('Passwords do not match. Please check and try again');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      await register({ name, email, password });
      toast.success('Account created successfully! Welcome to TaskNest');
      navigate('/dashboard');
    } catch (error) {
      // Handle specific error messages from backend
      const errorMessage = error.message;
      
      if (errorMessage.includes('email already exists') || errorMessage.includes('already exists')) {
        toast.error('This email is already registered. Please log in instead');
      } else if (errorMessage.includes('valid email')) {
        toast.error('Please enter a valid email address');
      } else if (errorMessage.includes('6 characters')) {
        toast.error('Password must be at least 6 characters long');
      } else if (errorMessage.includes('required fields')) {
        toast.error('Please fill in all required fields');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Connection problem. Please check your internet and try again');
      } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
        toast.error('Server temporarily unavailable. Please try again later');
      } else {
        toast.error('Registration failed. Please check your information and try again');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return { width: '0%', color: 'bg-gray-200' };
    if (password.length < 6) return { width: '25%', color: 'bg-red-500' };
    if (password.length < 10) return { width: '50%', color: 'bg-yellow-500' };
    if (password.length < 14) return { width: '75%', color: 'bg-blue-500' };
    return { width: '100%', color: 'bg-green-500' };
  };
  const passwordStrength = getPasswordStrength();

  const handleSocialLogin = async (provider) => {
    try {
      setSocialLoading({...socialLoading, [provider]: true});
      // Simulate getting a token from OAuth provider
      const mockToken = `mock-${provider}-token-${Date.now()}`;
      await socialLogin(provider, mockToken);
      toast.success(`Welcome! ${provider} registration successful`);
      navigate('/');
    } catch (error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('email already exists') || errorMessage.includes('already exists')) {
        toast.error(`This ${provider} account is already registered. Please log in instead`);
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error(`Connection problem. Please check your internet and try again`);
      } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
        toast.error(`Server temporarily unavailable. Please try again later`);
      } else {
        toast.error(`${provider} registration failed. Please try again`);
      }
    } finally {
      setSocialLoading({...socialLoading, [provider]: false});
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create an Account</h1>
        <p className="text-gray-600">Join TaskNest to manage your projects</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="form-label">Full Name</label>
          <input type="text" id="name" name="name" value={name} onChange={handleChange} className="form-input" placeholder="John Doe" required />
        </div>
        <div>
          <label htmlFor="email" className="form-label">Email Address</label>
          <input type="email" id="email" name="email" value={email} onChange={handleChange} className="form-input" placeholder="you@example.com" required />
        </div>
        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <input type="password" id="password" name="password" value={password} onChange={handleChange} className="form-input mb-1" placeholder="••••••••" required minLength="6" />
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
        </div>
        <div>
          <label htmlFor="passwordConfirm" className="form-label">Confirm Password</label>
          <input type="password" id="passwordConfirm" name="passwordConfirm" value={passwordConfirm} onChange={handleChange} className="form-input" placeholder="••••••••" required />
        </div>
        <div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center">
            {loading ? (<div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>) : ('Create Account')}
          </button>
        </div>
      </form>
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <button type="button" onClick={() => handleSocialLogin('google')} disabled={socialLoading.google} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
            {socialLoading.google ? (<div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-500 rounded-full"></div>) : (
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
            )}
          </button>
          <button type="button" onClick={() => handleSocialLogin('microsoft')} disabled={socialLoading.microsoft} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
            {socialLoading.microsoft ? (<div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-500 rounded-full"></div>) : (
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 23 23" fill="currentColor"><path d="M11.5 2a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM0 11.5a11.5 11.5 0 1 1 23 0 11.5 11.5 0 0 1-23 0z"/><path d="M11.5 5.5h-6v6h6v-6zM11.5 11.5h-6v6h6v-6zM11.5 5.5h6v6h-6v-6zM11.5 11.5h6v6h-6v-6z"/></svg>
            )}
          </button>
          <button type="button" onClick={() => handleSocialLogin('github')} disabled={socialLoading.github} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
            {socialLoading.github ? (<div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-gray-500 rounded-full"></div>) : (
              <svg className="h-5 w-5 text-gray-800" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            )}
          </button>
        </div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
