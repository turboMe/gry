'use client';

import { useEffect, type ReactNode } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/game-store';
import { usePWA } from '@/hooks/usePWA';
import { useDataSync } from '@/hooks/useDataSync';

/**
 * AuthProvider — listens to Firebase auth state and syncs to Zustand.
 * Also registers Service Worker via usePWA and syncs data via useDataSync.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  // Register SW + capture A2HS prompt
  usePWA();

  // Sync profile + history from Firestore on login
  useDataSync();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}

