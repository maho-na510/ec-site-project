import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Admin, LoginFormData } from '@app-types/index';
import { authService } from '@services/authService';
import { setActiveSession } from '@services/api';

/**
 * 認証コンテキスト
 *
 * 設計方針:
 * - ログイン状態はインメモリ（React state）のみで管理
 * - JWTはHttpOnly Cookieに保存（JSから参照不可）
 * - localStorage / sessionStorage にトークンは保存しない
 * - ページリロード時はAPIコールでCookieの有効性を確認して復元
 */

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

  // ページロード時: Cookie の有効性をAPIコールで確認して状態を復元
  useEffect(() => {
    // React StrictMode では effect が2回実行される。
    // キャンセルフラグで古い呼び出しの結果がログイン後の状態を上書きしないようにする。
    let isCurrent = true;

    const initAuth = async () => {
      try {
        const isAdminPath = window.location.pathname.startsWith('/admin');

        if (isAdminPath) {
          const adminData = await authService.getCurrentAdmin();
          if (!isCurrent) return;
          setUser(adminData);
          setIsAdmin(true);
          setActiveSession(true);
        } else {
          const userData = await authService.getCurrentUser();
          if (!isCurrent) return;
          setUser(userData);
          setIsAdmin(false);
          setActiveSession(true);
        }
      } catch {
        if (!isCurrent) return;
        // Cookie がない or 期限切れ → 未ログイン状態
        // user の初期値はすでに null なので setUser(null) は不要。
        // login() との競合時に login() の結果を上書きしないためここでは変更しない。
      } finally {
        if (!isCurrent) return;
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isCurrent = false;
    };
  }, []);

  const login = async (credentials: LoginFormData) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setIsAdmin(false);
    setActiveSession(true);
  };

  const adminLogin = async (credentials: LoginFormData) => {
    const response = await authService.adminLogin(credentials);
    setUser(response.admin);
    setIsAdmin(true);
    setActiveSession(true);
  };

  const logout = async () => {
    if (isAdmin) {
      await authService.adminLogout();
    } else {
      await authService.logout();
    }
    setUser(null);
    setIsAdmin(false);
    setActiveSession(false);
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
