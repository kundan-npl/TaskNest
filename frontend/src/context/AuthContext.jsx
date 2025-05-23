import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  // Check if token is valid
  const isTokenValid = (token) => {
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      console.log('AuthContext initializing, token:', token ? 'exists' : 'missing');
      if (token && isTokenValid(token)) {
        console.log('Token is valid, trying to get current user data');
        try {
          const userData = await authService.getCurrentUser();
          console.log('Got user data:', userData);
          setCurrentUser(userData);
        } catch (error) {
          console.error('Failed to get user data:', error);
          logout();
        }
      } else if (token) {
        console.log('Token exists but is invalid, logging out');
        // Token exists but is invalid
        logout();
      } else {
        console.log('No token found');
      }
      
      setLoading(false);
    };

    initAuth();
  }, [token]);

  // Login the user
  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token, user } = response;
    
    localStorage.setItem('token', token);
    setToken(token);
    setCurrentUser(user);
    
    return user;
  };

  // Social login
  const socialLogin = async (provider, token) => {
    try {
      const response = await authService.socialLogin(provider, token);
      const { token: authToken, user } = response;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setCurrentUser(user);
      
      return user;
    } catch (error) {
      throw new Error(error.response?.data?.error || `${provider} login failed`);
    }
  };

  // Register a new user
  const register = async (userData) => {
    const response = await authService.register(userData);
    const { token, user } = response;
    
    localStorage.setItem('token', token);
    setToken(token);
    setCurrentUser(user);
    
    return user;
  };

  // Logout the user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    navigate('/login');
  };

  // Check if user has a specific role
  const hasRole = (roles) => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  // Update the user profile
  const updateProfile = async (userData) => {
    const updatedUser = await authService.updateProfile(userData);
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  const value = {
    currentUser,
    loading,
    login,
    socialLogin,
    register,
    logout,
    hasRole,
    updateProfile,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
