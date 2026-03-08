'use client';

import { useEffect, type ReactNode } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/game-store';

/**
 * AuthProvider — listens to Firebase auth state and syncs to Zustand.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
