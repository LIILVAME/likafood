import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './authService';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const userData = authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
        // Disabled auto-login for development to test real authentication
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (phoneNumber, otp) => {
    try {
      setLoading(true);
      const userData = await authService.login(phoneNumber, otp);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (phoneNumber, otp, type = 'registration') => {
    try {
      setLoading(true);
      const userData = await authService.verifyOTP(phoneNumber, otp, type);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('OTP verification failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (phoneNumber, businessName, ownerName) => {
    try {
      const result = await authService.register(phoneNumber, businessName, ownerName);
      return { success: true, data: result };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message };
    }
  };

  const requestOTP = async (phoneNumber, businessName = null, ownerName = null) => {
    try {
      if (businessName && ownerName) {
        // Registration flow - send OTP with business details
        await authService.requestOTP(phoneNumber, businessName, ownerName);
      } else {
        // Login flow - user should already exist, return error to prompt registration
        throw new Error('User not found. Please register first.');
      }
      return { success: true };
    } catch (error) {
      console.error('OTP request failed:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    requestOTP,
    verifyOTP,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}