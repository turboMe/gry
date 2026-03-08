'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/game-store';

/**
 * Landing page — redirect to menu (or login if not authenticated)
 */
export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/menu');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex-center" style={{ flex: 1 }}>
      <div className="text-center">
        <div className="game-logo">Między Nami</div>
        <div className="game-subtitle">Symulator Relacji</div>
        <div className="loading-spinner" style={{ marginTop: 32 }} />
      </div>
    </div>
  );
}
