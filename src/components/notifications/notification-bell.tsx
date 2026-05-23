"use client";

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { markNotificationRead } from '@/lib/store';
import type { AppNotification } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  onRead: (id: string) => void;
}

export function NotificationBell({ notifications, unreadCount, onRead }: Props) {
  const handleRead = async (n: AppNotification) => {
    if (n.isRead) return;
    try {
      await markNotificationRead(n.id);
      onRead(n.id);
    } catch {
      // ignore
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl hover:bg-white/10 border border-white/10 text-white/80 hover:text-white"
          title="Alertas de vencimiento"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-black text-white flex items-center justify-center ring-2 ring-primary">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 rounded-xl shadow-2xl border-primary/10">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-[11px] font-black uppercase tracking-widest text-primary">
            Alertas de Vencimiento
          </span>
          {unreadCount > 0 && (
            <Badge className="bg-destructive text-white text-[9px] font-black px-2 py-0.5">
              {unreadCount} sin leer
            </Badge>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-[11px] text-muted-foreground">
              Sin alertas de vencimiento
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleRead(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors",
                    !n.isRead && "bg-destructive/5"
                  )}
                >
                  <p className={cn(
                    "text-[11px] leading-snug",
                    !n.isRead ? "text-destructive font-black" : "text-muted-foreground font-medium"
                  )}>
                    {n.message}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1 font-mono">
                    {format(new Date(n.createdAt), 'dd/MM/yy HH:mm')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
