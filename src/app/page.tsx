"use client"

import { AuthProvider, useAuth } from '@/components/auth-context';
import { LoginView } from '@/components/login-view';
import { DashboardView } from '@/components/dashboard-view';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando Paucartambo Segura...</p>
        </div>
      </div>
    );
  }

  return user ? <DashboardView /> : <LoginView />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}