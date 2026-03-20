"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateCredentials: (newUsername: string, newPassword: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciales por defecto iniciales
const DEFAULT_CREDENTIALS = [
  { username: 'admin1', password: 'admin1' },
  { username: 'admin2', password: 'admin2' }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializar credenciales si no existen
    const existingCreds = localStorage.getItem('ps_credentials');
    if (!existingCreds) {
      localStorage.setItem('ps_credentials', JSON.stringify(DEFAULT_CREDENTIALS));
    }

    const storedUser = localStorage.getItem('ps_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
      return true;
    }
    return false;
  };

  const updateCredentials = (newUsername: string, newPassword: string) => {
    if (!user) return;

    const credsStr = localStorage.getItem('ps_credentials');
    let credentials = credsStr ? JSON.parse(credsStr) : [...DEFAULT_CREDENTIALS];

    // Actualizar la entrada del usuario actual
    credentials = credentials.map((c: any) => 
      c.username === user.username ? { username: newUsername, password: newPassword } : c
    );

    localStorage.setItem('ps_credentials', JSON.stringify(credentials));
    
    // Actualizar sesión actual
    const updatedUser: User = { ...user, username: newUsername };
    setUser(updatedUser);
    localStorage.setItem('ps_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ps_user');
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
