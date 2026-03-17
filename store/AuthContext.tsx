import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Role, RolePermissions, ROLE_PERMISSIONS } from '../types';
import { authService } from '../services/authService';
import { ApiError, tokenStore } from '../services/apiClient';
import { demoStudentUser } from '../data/demoModeData';

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => Promise<void>;
  setRole: (role: Role) => void;
  startDemoMode: () => Promise<void>;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  /** Internal: called by other contexts to subscribe to post-login data loading */
  _onLoginSuccess: React.MutableRefObject<((user: User) => void)[]>;
  /** Internal: called by notification context */
  _addNotification: React.MutableRefObject<((n: { type: string; title: string; message: string }) => void) | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const demoBootstrapPromise = useRef<Promise<void> | null>(null);
  const isDemoModeRef = useRef(isDemoMode);
  const _onLoginSuccess = useRef<((user: User) => void)[]>([]);
  const _addNotification = useRef<((n: { type: string; title: string; message: string }) => void) | null>(null);

  useEffect(() => {
    isDemoModeRef.current = isDemoMode;
  }, [isDemoMode]);

  // Session restore on mount
  useEffect(() => {
    const demoFlag = localStorage.getItem('codequest_demo_mode') === 'true';
    if (demoFlag) {
      startDemoMode().catch((err) => {
        console.error('Failed to restore demo mode:', err);
      });
      return;
    }

    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setIsAuthenticated(true);
      setCurrentUser(storedUser);
      _onLoginSuccess.current.forEach(cb => cb(storedUser));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDemoMode = async (): Promise<void> => {
    if (demoBootstrapPromise.current) {
      return demoBootstrapPromise.current;
    }

    const bootstrap = (async () => {
      const demoUser: User = { ...demoStudentUser, lastLogin: new Date().toISOString() };
      localStorage.setItem('codequest_demo_mode', 'true');
      tokenStore.clear();
      setIsAuthenticated(true);
      setCurrentUser(demoUser);
      setIsDemoMode(true);

      _addNotification.current?.({
        type: 'info',
        title: 'Demo Mode Enabled',
        message: 'You are now in secure student demo mode.',
      });
    })().finally(() => {
      demoBootstrapPromise.current = null;
    });

    demoBootstrapPromise.current = bootstrap;
    return bootstrap;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      localStorage.removeItem('codequest_demo_mode');
      const user = await authService.login(email, password);
      const enrichedUser = { ...user, lastLogin: new Date().toISOString() };
      setIsAuthenticated(true);
      setCurrentUser(enrichedUser);
      setIsDemoMode(false);
      _onLoginSuccess.current.forEach(cb => cb(enrichedUser));
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      _addNotification.current?.({
        type: 'error',
        title: 'Login Failed',
        message: err instanceof ApiError ? err.message : 'Invalid email or password',
      });
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string, role: Role): Promise<boolean> => {
    try {
      localStorage.removeItem('codequest_demo_mode');
      const user = await authService.signup(name, email, password, role);
      setIsAuthenticated(true);
      setCurrentUser(user);
      setIsDemoMode(false);
      _onLoginSuccess.current.forEach(cb => cb(user));
      return true;
    } catch (err) {
      console.error('Signup failed:', err);
      _addNotification.current?.({
        type: 'error',
        title: 'Signup Failed',
        message: err instanceof ApiError ? err.message : 'Could not create account',
      });
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('codequest_demo_mode');
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsDemoMode(false);
  };

  const setRole = (role: Role) => {
    setCurrentUser(prev => prev ? { ...prev, role } : null);
  };

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!currentUser?.role) return false;
    return ROLE_PERMISSIONS[currentUser.role]?.[permission] ?? false;
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentUser,
      isDemoMode,
      login,
      signup,
      logout,
      setRole,
      startDemoMode,
      hasPermission,
      _onLoginSuccess,
      _addNotification,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
