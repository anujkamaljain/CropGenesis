import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: userData, token },
        });
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      console.log('AuthContext login called with:', credentials);
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      console.log('Making API call to authAPI.login...');
      const response = await authAPI.login(credentials);
      console.log('API response received:', response);
      const { user, token } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token },
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Try to call logout API (optional - JWT logout is client-side)
      try {
        await authAPI.logout();
      } catch (apiError) {
        console.log('Logout API call failed, continuing with local logout:', apiError);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear localStorage and local state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.data.user;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser,
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
