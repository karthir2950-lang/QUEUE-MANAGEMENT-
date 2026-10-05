import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartqueue_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error("Token invalid or expired", error);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem('smartqueue_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const googleLogin = async (googleToken) => {
    const data = await authService.googleLogin(googleToken);
    localStorage.setItem('smartqueue_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = () => {
    localStorage.removeItem('smartqueue_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium tracking-wide animate-pulse">Loading SmartQueue...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, login, googleLogin, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
