'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth-context';
import { fetchNotifications, triggerExpiredCheck } from '@/lib/store';
import type { AppNotification } from '@/lib/types';

const POLL_INTERVAL_MS = 60_000;

export function useNotifications() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!isSuperadmin) return;
    try {
      await triggerExpiredCheck();
      const list = await fetchNotifications();
      setNotifications(list);
    } catch {
      // Silent fail — polling continues
    }
  }, [isSuperadmin]);

  useEffect(() => {
    if (!isSuperadmin) {
      setNotifications([]);
      return;
    }
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSuperadmin, refresh]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return { notifications, unreadCount, refresh };
}
