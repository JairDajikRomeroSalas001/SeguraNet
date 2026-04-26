"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit-logger';
import { encryptData, decryptData } from '@/lib/crypto';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCredentials: (newUsername: string, newPassword: string, newFullName: string, newDni: string) => Promise<void>;
  getAllUsers: () => Promise<{ username: string, fullName: string, dni: string }[]>;
  addUser: (username: string, password: string, fullName: string, dni: string) => Promise<void>;
  deleteUser: (username: string) => Promise<void>;
  isLoading: boolean;
  loginAttempts: number;
  isLocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_CREDENTIALS = [
  { 
    username: 'admin1', 
    password: 'admin1', 
    fullName: 'MARCO ANTONIO CASAS SOLIS', 
    dni: '98543265' 
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // Inicializar credenciales cifradas si no existen
      const encryptedCreds = localStorage.getItem('ps_credentials_enc');
      if (!encryptedCreds) {
        const encrypted = await encryptData(DEFAULT_CREDENTIALS);
        localStorage.setItem('ps_credentials_enc', encrypted);
      }

      // Recuperar sesión activa
      const storedUserEnc = localStorage.getItem('ps_user_enc');
      const sessionFingerprint = localStorage.getItem('ps_session_fingerprint');
      
      if (storedUserEnc && sessionFingerprint) {
        // Validación de huella digital de sesión (User-Agent)
        if (navigator.userAgent !== sessionFingerprint) {
          logout();
        } else {
          const decryptedUser = await decryptData(storedUserEnc);
          if (decryptedUser) setUser(decryptedUser);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    if (isLocked) return false;

    const encryptedCreds = localStorage.getItem('ps_credentials_enc');
    const credentials = encryptedCreds ? await decryptData(encryptedCreds) : DEFAULT_CREDENTIALS;

    const found = credentials.find((c: any) => c.username === username && c.password === password);
    
    if (found) {
      const newUser: User = { 
        username: found.username, 
        fullName: found.fullName, 
        dni: found.dni,
        role: 'admin' 
      };
      
      setUser(newUser);
      setLoginAttempts(0);
      
      const encryptedUser = await encryptData(newUser);
      localStorage.setItem('ps_user_enc', encryptedUser);
      localStorage.setItem('ps_session_fingerprint', navigator.userAgent);
      
      logAuditEvent(newUser.username, 'LOGIN', `Sesión segura iniciada por ${newUser.fullName}`);
      return true;
    }
    
    // Protección contra fuerza bruta
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    if (newAttempts >= 5) {
      setIsLocked(true);
      logAuditEvent(username, 'SECURITY_VIOLATION', 'Cuenta bloqueada temporalmente por múltiples intentos fallidos');
      setTimeout(() => setIsLocked(false), 300000); // 5 min de bloqueo
    }
    
    logAuditEvent(username, 'SECURITY_VIOLATION', `Intento de login fallido (${newAttempts}/5)`);
    return false;
  };

  const updateCredentials = async (newUsername: string, newPassword: string, newFullName: string, newDni: string) => {
    if (!user) return;

    const encryptedCreds = localStorage.getItem('ps_credentials_enc');
    let credentials = encryptedCreds ? await decryptData(encryptedCreds) : [...DEFAULT_CREDENTIALS];

    credentials = credentials.map((c: any) => 
      c.username === user.username 
        ? { username: newUsername, password: newPassword, fullName: newFullName, dni: newDni } 
        : c
    );

    const encryptedNewCreds = await encryptData(credentials);
    localStorage.setItem('ps_credentials_enc', encryptedNewCreds);
    
    const updatedUser: User = { ...user, username: newUsername, fullName: newFullName, dni: newDni };
    setUser(updatedUser);
    
    const encryptedUser = await encryptData(updatedUser);
    localStorage.setItem('ps_user_enc', encryptedUser);
    
    logAuditEvent(user.username, 'UPDATE_CREDENTIALS', `Perfil actualizado y cifrado`);
  };

  const getAllUsers = async () => {
    const encryptedCreds = localStorage.getItem('ps_credentials_enc');
    const credentials = encryptedCreds ? await decryptData(encryptedCreds) : DEFAULT_CREDENTIALS;
    return credentials.map((c: any) => ({ 
      username: c.username, 
      fullName: c.fullName,
      dni: c.dni
    }));
  };

  const addUser = async (username: string, password: string, fullName: string, dni: string) => {
    const encryptedCreds = localStorage.getItem('ps_credentials_enc');
    let credentials = encryptedCreds ? await decryptData(encryptedCreds) : [...DEFAULT_CREDENTIALS];
    
    if (credentials.find((c: any) => c.username === username)) {
      throw new Error('El ID de usuario ya existe');
    }

    credentials.push({ username, password, fullName, dni });
    const encryptedNewCreds = await encryptData(credentials);
    localStorage.setItem('ps_credentials_enc', encryptedNewCreds);
    
    if (user) {
      logAuditEvent(user.username, 'CREATE_USER', `Nueva cuenta oficial cifrada para: ${fullName}`);
    }
  };

  const deleteUser = async (username: string) => {
    if (user?.username === username) throw new Error('No puedes eliminar tu propia cuenta');

    const encryptedCreds = localStorage.getItem('ps_credentials_enc');
    let credentials = encryptedCreds ? await decryptData(encryptedCreds) : [...DEFAULT_CREDENTIALS];

    credentials = credentials.filter((c: any) => c.username !== username);
    const encryptedNewCreds = await encryptData(credentials);
    localStorage.setItem('ps_credentials_enc', encryptedNewCreds);
    
    if (user) {
      logAuditEvent(user.username, 'DELETE_USER', `Cuenta oficial revocada: ${username}`);
    }
  };

  const logout = () => {
    if (user) {
      logAuditEvent(user.username, 'LOGOUT', 'Sesión cerrada de forma segura');
    }
    setUser(null);
    localStorage.removeItem('ps_user_enc');
    localStorage.removeItem('ps_session_fingerprint');
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, updateCredentials, getAllUsers, addUser, deleteUser, isLoading, loginAttempts, isLocked 
    }}>
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
