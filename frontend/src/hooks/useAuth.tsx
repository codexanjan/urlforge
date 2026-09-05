import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { DEFAULT_USER } from '../data/mockStore';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: { email: string; password: string; remember_me?: boolean }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; confirm_password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always authenticated as DEFAULT_USER - No login gate!
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('urlforge_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  });

  const isLoading = false;
  const isAuthenticated = true;
  const isAdmin = user.role === 'ADMIN';

  const login = async (_data: { email: string; password: string; remember_me?: boolean }) => {
    // Immediate success
    return Promise.resolve();
  };

  const register = async (data: { name: string; email: string; password: string; confirm_password: string }) => {
    const updatedUser: User = {
      ...user,
      name: data.name || user.name,
      email: data.email || user.email,
    };
    setUser(updatedUser);
    localStorage.setItem('urlforge_user', JSON.stringify(updatedUser));
    return Promise.resolve();
  };

  const logout = async () => {
    // Reset to default
    setUser(DEFAULT_USER);
    localStorage.setItem('urlforge_user', JSON.stringify(DEFAULT_USER));
    return Promise.resolve();
  };

  const refreshProfile = async () => {
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
