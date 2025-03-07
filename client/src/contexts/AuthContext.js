import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('aquaponicsToken');
        
        if (token) {
          // Check if it's our mock token for demo purposes
          if (token.includes('mock-token-for-demo')) {
            // Create mock user data
            const mockUserData = {
              _id: '123',
              name: 'Admin User',
              email: 'admin@aquaponics.com',
              role: 'admin',
              darkMode: false,
              notificationEmail: 'admin@aquaponics.com',
              token: token
            };
            
            // Set auth header for all axios requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(mockUserData);
            setIsAuthenticated(true);
          } else {
            // Regular JWT token handling
            try {
              // Check if token is expired
              const decodedToken = jwtDecode(token);
              const currentTime = Date.now() / 1000;
              
              if (decodedToken.exp < currentTime) {
                // Token is expired, log out
                localStorage.removeItem('aquaponicsToken');
                setUser(null);
                setIsAuthenticated(false);
              } else {
                // Set auth header for all axios requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                // Get user data
                const response = await axios.get('/api/users/profile');
                setUser(response.data);
                setIsAuthenticated(true);
              }
            } catch (err) {
              // If API call fails, fall back to mock data
              console.error('API connection error - using mock data');
              localStorage.removeItem('aquaponicsToken');
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('aquaponicsToken');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/api/users/register', userData);
      
      // Store token and user data
      localStorage.setItem('aquaponicsToken', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      setUser(response.data);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  // Login user with mock support for demo
  const login = async (email, password) => {
    try {
      setError(null);
      
      // For demo purposes - mock admin account
      if (email === 'admin@aquaponics.com' && password === 'admin123') {
        // Create mock token and user data
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoiYWRtaW5AYXF1YXBvbmljcy5jb20iLCJpYXQiOjE2Njk5MTQ2MzAsImV4cCI6MTk5OTk5OTk5OX0.mock-token-for-demo';
        const mockUserData = {
          _id: '123',
          name: 'Admin User',
          email: 'admin@aquaponics.com',
          role: 'admin',
          darkMode: false,
          notificationEmail: 'admin@aquaponics.com',
          token: mockToken
        };
        
        // Store mock token and user data
        localStorage.setItem('aquaponicsToken', mockToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        
        setUser(mockUserData);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      // For actual API integration - keep the original code
      try {
        const response = await axios.post('/api/users/login', { email, password });
        
        // Store token and user data
        localStorage.setItem('aquaponicsToken', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        setUser(response.data);
        setIsAuthenticated(true);
        
        return { success: true };
      } catch (err) {
        // If API call fails but we're using demo credentials, don't show error
        if (email === 'admin@aquaponics.com' && password === 'admin123') {
          throw new Error('Please use the mock credentials');
        }
        throw err;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('aquaponicsToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await axios.put('/api/users/profile', userData);
      
      // Update stored token if a new one is returned
      if (response.data.token) {
        localStorage.setItem('aquaponicsToken', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      
      setUser(response.data);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed');
      return { success: false, error: error.response?.data?.message || 'Profile update failed' };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setError(null);
      await axios.post('/api/users/forgotpassword', { email });
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset email');
      return { success: false, error: error.response?.data?.message || 'Failed to send reset email' };
    }
  };

  // Reset password
  const resetPassword = async (password, resetToken) => {
    try {
      setError(null);
      await axios.put(`/api/users/resetpassword/${resetToken}`, { password });
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Password reset failed');
      return { success: false, error: error.response?.data?.message || 'Password reset failed' };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
