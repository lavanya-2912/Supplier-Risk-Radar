import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

const DEFAULT_USER: User = {
  id: 1,
  email: 'demo@supplierrisk.com',
  name: 'Procurement Lead',
  role: 'Procurement Lead',
  is_active: true,
  created_at: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>('authenticated_session');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const me = await authApi.getMe();
        if (me) {
          setUser(me);
        }
      } catch (e) {
        // Silently keep default demo user if API endpoint is not called
      }
    };
    initAuth();
  }, []);

  const login = async () => {};

  const register = async () => {};

  const logout = () => {};

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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

