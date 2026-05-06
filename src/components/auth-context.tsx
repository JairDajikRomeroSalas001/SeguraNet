"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import type { Role, SessionUser } from '@/lib/types';

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  isLocked: boolean;
  loginAttempts: number;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.get<{ user: SessionUser | null }>('/api/auth/session');
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setIsLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    if (isLocked) return false;
    try {
      const { user } = await api.post<{ user: SessionUser }>('/api/auth/login', { username, password });
      setUser(user);
      setLoginAttempts(0);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setIsLocked(true);
        setTimeout(() => setIsLocked(false), 30 * 60 * 1000);
        return false;
      }
      setLoginAttempts(n => n + 1);
      return false;
    }
  }, [isLocked]);

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isLocked, loginAttempts, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export function useRole(): Role | null {
  return useAuth().user?.role ?? null;
}

export function useIsSuperadmin(): boolean {
  return useAuth().user?.role === 'superadmin';
}
