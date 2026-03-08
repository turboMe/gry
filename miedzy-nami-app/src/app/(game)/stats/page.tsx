'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SessionRecord {
  scenarioId: string;
  date: string;
  score: number;
  maxScore: number;
  endingColor: string;
}

/**
 * Stats page — game statistics and session history.
 */
export default function StatsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mn_session_history');
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Calculate stats
  const totalGames = history.length;
  const avgScore = totalGames > 0
    ? history.reduce((sum, h) => sum + h.score, 0) / totalGames
    : 0;

  const endingCounts = { green: 0, yellow: 0, red: 0 };
  history.forEach(h => {
    if (h.endingColor in endingCounts) {
      endingCounts[h.endingColor as keyof typeof endingCounts]++;
    }
  });

  return (
    <div className="screen fade-in">
      <div className="scroll-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 16px' }}>
          <button className="back-btn" onClick={() => router.push('/menu')}>←</button>
          <h2 className="heading-section">Statystyki</h2>
        </div>

        {totalGames === 0 ? (
          <div className="text-center" style={{ marginTop: 40, color: 'var(--text-dim)' }}>
            Zagraj swoją pierwszą sesję, aby zobaczyć statystyki.
          </div>
        ) : (
          <>
            <div className="stat-card">
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 8 }}>
                Rozegrane sesje
              </h4>
              <div className="stat-big">{totalGames}</div>
            </div>

            <div className="stat-card">
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 8 }}>
                Średni wynik
              </h4>
              <div className="stat-big">{avgScore.toFixed(1)}</div>
              <div className="text-dim" style={{ fontSize: '0.8rem' }}>punktów na sesję</div>
            </div>

            <div className="stat-card">
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 8 }}>
                Rozkład zakończeń
              </h4>
              <div className="stat-row">
                <span>🟢 Odbudowa więzi</span>
                <span className="text-mono" style={{ color: 'var(--accent-green)' }}>{endingCounts.green}</span>
              </div>
              <div className="stat-row">
                <span>🟡 Kompromis</span>
                <span className="text-mono" style={{ color: 'var(--accent-gold)' }}>{endingCounts.yellow}</span>
              </div>
              <div className="stat-row">
                <span>🔴 Eskalacja</span>
                <span className="text-mono" style={{ color: 'var(--accent-red)' }}>{endingCounts.red}</span>
              </div>
            </div>

            {/* Recent sessions */}
            <h3 className="heading-section" style={{ margin: '20px 0 12px' }}>Ostatnie sesje</h3>
            {[...history].reverse().slice(0, 10).map((session, i) => {
              const dateStr = new Date(session.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              const emoji = session.endingColor === 'green' ? '🟢' : session.endingColor === 'yellow' ? '🟡' : '🔴';
              return (
                <div key={i} className="card" style={{ padding: '12px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ marginRight: 8 }}>{emoji}</span>
                      <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{session.scenarioId}</span>
                    </div>
                    <span className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                      {session.score}/{session.maxScore}
                    </span>
                  </div>
                  <div className="text-dim" style={{ fontSize: '0.72rem', marginTop: 4 }}>{dateStr}</div>
                </div>
              );
            })}
          </>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
