import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import api from '../services/api';
import { endpoints } from '../constants/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const logout = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
    } catch (err) { console.warn('Auth operation failed:', err); }
    setState({ token: null, user: null, isLoading: false, isAuthenticated: false });
  }, []);

  useEffect(() => {
    api.setOnUnauthorized(logout);
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        setState({ token: null, user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const res = await api.get<{ user: User }>(endpoints.auth.verify);
      if (res.success && res.user) {
        setState({ token, user: res.user, isLoading: false, isAuthenticated: true });
      } else {
        await logout();
      }
    } catch {
      await logout();
    }
  };

  const login = async (token: string, user: User) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    setState({ token, user, isLoading: false, isAuthenticated: true });
  };

  const refreshUser = async () => {
    const res = await api.get<{ user: User }>(endpoints.auth.verify);
    if (res.success && res.user) {
      setState(prev => ({ ...prev, user: res.user }));
      await SecureStore.setItemAsync('auth_user', JSON.stringify(res.user));
    }
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { ...state, login, logout, refreshUser } },
    children
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
