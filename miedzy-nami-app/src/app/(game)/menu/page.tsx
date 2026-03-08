'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/store/game-store';

/**
 * Main Menu — the home screen of the game.
 */
export default function MenuPage() {
  const router = useRouter();
  const { quizCompleted } = useProfileStore();
  const [stats, setStats] = useState<{ totalGames: number; avgScore: string } | null>(null);

  useEffect(() => {
    // Load basic stats from localStorage (MVP — will move to API later)
    try {
      const history = JSON.parse(localStorage.getItem('mn_session_history') || '[]');
      if (history.length > 0) {
        const avg = (history.reduce((a: number, s: { score: number }) => a + s.score, 0) / history.length);
        setStats({ totalGames: history.length, avgScore: avg.toFixed(1) });
      }
    } catch { /* ignore */ }
  }, []);

  const handlePlay = () => {
    if (!quizCompleted) {
      // Check localStorage for saved profile (from previous sessions)
      const saved = localStorage.getItem('mn_player_profile');
      if (!saved) {
        router.push('/quiz');
        return;
      }
    }
    router.push('/scenarios');
  };

  const handleProfile = () => {
    const saved = localStorage.getItem('mn_player_profile');
    if (saved) {
      router.push('/profile');
    } else {
      router.push('/quiz');
    }
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
            <span className="btn-label">{localStorage.getItem('mn_player_profile') ? 'Twój profil' : 'Stwórz profil'}</span>
            <span className="btn-arrow">→</span>
          </button>

          <button className="btn" onClick={() => router.push('/stats')}>
            <span className="btn-icon">📊</span>
            <span className="btn-label">Statystyki</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Interaktywny komiks o psychologii komunikacji
        </div>
      </div>
    </div>
  );
}
