
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit-logger';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateCredentials: (newUsername: string, newPassword: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_CREDENTIALS = [
  { username: 'admin1', password: 'admin1' },
  { username: 'admin2', password: 'admin2' }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingCreds = localStorage.getItem('ps_credentials');
    if (!existingCreds) {
      localStorage.setItem('ps_credentials', JSON.stringify(DEFAULT_CREDENTIALS));
    }

    const storedUser = localStorage.getItem('ps_user');
    const sessionFingerprint = localStorage.getItem('ps_session_fingerprint');
    
    // Validación de integridad de sesión (Defensa contra Session Hijacking)
    if (storedUser && sessionFingerprint) {
      const currentFingerprint = navigator.userAgent;
      if (currentFingerprint !== sessionFingerprint) {
        logout(); // Invalidar si el User-Agent cambió
      } else {
        setUser(JSON.parse(storedUser));
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string) => {
    const credsStr = localStorage.getItem('ps_credentials');
    const credentials = credsStr ? JSON.parse(credsStr) : DEFAULT_CREDENTIALS;

    const found = credentials.find((c: any) => c.username === username && c.password === password);
    
    if (found) {
      const newUser: User = { username: found.username, role: 'admin' };
      setUser(newUser);
      localStorage.setItem('ps_user', JSON.stringify(newUser));
      // Guardar huella del dispositivo para validación continua
      localStorage.setItem('ps_session_fingerprint', navigator.userAgent);
      
      logAuditEvent(newUser.username, 'LOGIN', 'Successful authentication');
      return true;
    }
    
    logAuditEvent(username, 'SECURITY_VIOLATION', 'Failed login attempt');
    return false;
  };

  const updateCredentials = (newUsername: string, newPassword: string) => {
    if (!user) return;

    const credsStr = localStorage.getItem('ps_credentials');
    let credentials = credsStr ? JSON.parse(credsStr) : [...DEFAULT_CREDENTIALS];

    credentials = credentials.map((c: any) => 
      c.username === user.username ? { username: newUsername, password: newPassword } : c
    );

    localStorage.setItem('ps_credentials', JSON.stringify(credentials));
    
    const updatedUser: User = { ...user, username: newUsername };
    setUser(updatedUser);
    localStorage.setItem('ps_user', JSON.stringify(updatedUser));
    
    logAuditEvent(user.username, 'UPDATE_CREDENTIALS', `Username changed to ${newUsername}`);
  };

  const logout = () => {
    if (user) {
      logAuditEvent(user.username, 'LOGOUT', 'Manual session termination');
    }
    setUser(null);
    localStorage.removeItem('ps_user');
    localStorage.removeItem('ps_session_fingerprint');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateCredentials, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
