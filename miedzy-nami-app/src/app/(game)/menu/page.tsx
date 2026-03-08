'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore, useAuthStore } from '@/store/game-store';
import { getIdToken, logOut } from '@/lib/firebase/auth';

/**
 * Main Menu — the home screen of the game.
 */
export default function MenuPage() {
  const router = useRouter();
  const { quizCompleted } = useProfileStore();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<{ totalGames: number; avgScore: string } | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for saved profile
    const saved = localStorage.getItem('mn_player_profile');
    setHasProfile(!!saved);

    // Load basic stats from localStorage
    try {
      const history = JSON.parse(localStorage.getItem('mn_session_history') || '[]');
      if (history.length > 0) {
        const avg = (history.reduce((a: number, s: { score: number }) => a + s.score, 0) / history.length);
        setStats({ totalGames: history.length, avgScore: avg.toFixed(1) });
      }
    } catch { /* ignore */ }
  }, []);

  // Check admin status silently
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setIsAdmin(true);
      } catch { /* not admin, that's fine */ }
    })();
  }, [user]);

  const handlePlay = () => {
    if (!quizCompleted && !hasProfile) {
      router.push('/quiz');
      return;
    }
    router.push('/scenarios');
  };

  const handleProfile = () => {
    if (hasProfile) {
      router.push('/profile');
    } else {
      router.push('/quiz');
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.replace('/login');
  };

  return (
    <div className="screen fade-in" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
      <div className="menu-bg" />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        <div className="game-logo">Między Nami</div>
        <div className="game-subtitle">Symulator Relacji</div>
        <div className="menu-divider" />

        {stats && (
          <div className="text-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', marginBottom: 28, opacity: 0.9 }}>
            Sesji: {stats.totalGames} · Średni wynik: {stats.avgScore}
          </div>
        )}

        <div className="flex-col gap-md" style={{ marginBottom: 24 }}>
          <button className="btn btn-primary" onClick={handlePlay}>
            <span className="btn-icon">🎮</span>
            <span className="btn-label">Graj</span>
            <span className="btn-arrow">→</span>
          </button>

          <button className="btn" onClick={handleProfile}>
            <span className="btn-icon">👤</span>
            <span className="btn-label">{hasProfile ? 'Twój profil' : 'Stwórz profil'}</span>
            <span className="btn-arrow">→</span>
          </button>

          <button className="btn" onClick={() => router.push('/stats')}>
            <span className="btn-icon">📊</span>
            <span className="btn-label">Statystyki</span>
            <span className="btn-arrow">→</span>
          </button>

          {isAdmin && (
            <button className="btn" onClick={() => router.push('/admin')} style={{ borderColor: 'rgba(255,215,0,0.3)' }}>
              <span className="btn-icon">⚙️</span>
              <span className="btn-label">Panel Admina</span>
              <span className="btn-arrow">→</span>
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Interaktywny komiks o psychologii komunikacji
        </div>

        {user && (
          <button
            onClick={handleLogout}
            style={{
              marginTop: 24,
              background: 'none',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '10px 24px',
              color: 'var(--text-dim)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🚪 Wyloguj się
          </button>
        )}
      </div>
    </div>
  );
}

