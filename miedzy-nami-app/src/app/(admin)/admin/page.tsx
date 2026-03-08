'use client';

import { useEffect, useState } from 'react';
import { getIdToken } from '@/lib/firebase/auth';

interface Stats {
  totalUsers: number;
  totalSessions: number;
  totalScenarios: number;
  avgScore: number;
  recentSessions: number;
  scoredSessions: number;
}

/**
 * Admin Dashboard — key platform statistics.
 */
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Nie udało się pobrać statystyk');
        const data = await res.json();
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Błąd');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <div className="admin-error">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Użytkownicy', value: stats.totalUsers, icon: '👥', color: 'var(--accent-cyan)' },
    { label: 'Scenariusze', value: stats.totalScenarios, icon: '📖', color: 'var(--accent-gold)' },
    { label: 'Sesje gry', value: stats.totalSessions, icon: '🎮', color: 'var(--accent-green)' },
    { label: 'Sesje (7 dni)', value: stats.recentSessions, icon: '📈', color: 'var(--accent-orange)' },
    { label: 'Średni wynik', value: stats.avgScore, icon: '⭐', color: 'var(--accent-magenta)' },
    { label: 'Ukończone', value: stats.scoredSessions, icon: '✅', color: 'var(--accent-purple)' },
  ];

  return (
    <div className="admin-page fade-in">
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-page-subtitle">Między Nami — Przegląd platformy</p>

      <div className="admin-stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="admin-stat-card">
            <div className="admin-stat-icon">{card.icon}</div>
            <div className="admin-stat-value" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="admin-stat-label">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
