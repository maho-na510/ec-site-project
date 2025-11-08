import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Admin, LoginFormData } from '@types/index';
import { authService } from '@services/authService';

interface AuthContextType {
  user: User | Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: LoginFormData) => Promise<void>;
  adminLogin: (credentials: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      if (!authService.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        // Determine if admin based on current path or stored flag
        const isAdminPath = window.location.pathname.startsWith('/admin');
        const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
        const checkAdmin = isAdminPath || storedIsAdmin;

        if (checkAdmin) {
          const adminData = await authService.getCurrentAdmin();
          setUser(adminData);
          setIsAdmin(true);
          localStorage.setItem('isAdmin', 'true');
        } else {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAdmin(false);
          localStorage.setItem('isAdmin', 'false');
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        authService.clearTokens();
        localStorage.removeItem('isAdmin');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginFormData) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setIsAdmin(false);
    localStorage.setItem('isAdmin', 'false');
  };

  const adminLogin = async (credentials: LoginFormData) => {
    const response = await authService.adminLogin(credentials);
    setUser(response.user);
    setIsAdmin(true);
    localStorage.setItem('isAdmin', 'true');
  };

  const logout = async () => {
    if (isAdmin) {
      await authService.adminLogout();
    } else {
      await authService.logout();
    }
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  const refreshUser = async () => {
    if (isAdmin) {
      const adminData = await authService.getCurrentAdmin();
      setUser(adminData);
    } else {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    login,
    adminLogin,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
