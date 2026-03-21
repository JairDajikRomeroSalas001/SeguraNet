
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-context';

/**
 * Hook de cierre de sesión automático por inactividad.
 * Cumple con protocolos de seguridad para estaciones de trabajo públicas (5 minutos).
 */
export function useSessionTimeout(timeoutMs: number = 5 * 60 * 1000) {
  const { user, logout } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      timerRef.current = setTimeout(() => {
        logout();
        // Notificar al sistema de auditoría del cierre por inactividad
        // logAuditEvent(user.username, 'SECURITY_VIOLATION', 'Session timeout due to inactivity');
      }, timeoutMs);
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    if (user) {
      resetTimer();
      events.forEach(event => window.addEventListener(event, resetTimer));
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);
}
