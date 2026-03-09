'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { STYLE_LABELS } from '@/lib/engine/game-engine';
import type { CommunicationStyle } from '@/lib/types';

// ═══════════════════════════════════════════════════════════
//  Types & Constants
// ═══════════════════════════════════════════════════════════

interface SessionRecord {
  scenarioId: string;
  scenarioTitle?: string;
  date: string;
  score: number;
  maxScore: number;
  endingColor: string;
  dominantStyle?: CommunicationStyle;
}

const ENDING_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  blue:   { emoji: '🔵', label: 'Głębokie zrozumienie', color: 'var(--accent-cyan)' },
  green:  { emoji: '🟢', label: 'Odbudowa więzi',       color: 'var(--accent-green)' },
  yellow: { emoji: '🟡', label: 'Kompromis',            color: 'var(--accent-gold)' },
  red:    { emoji: '🔴', label: 'Eskalacja',            color: 'var(--accent-red)' },
};

const STYLE_COLORS: Partial<Record<CommunicationStyle, string>> = {
  empathic: 'var(--accent-green)',
  assertive: 'var(--accent-cyan)',
  transformative: 'var(--accent-cyan)',
  transactional: 'var(--accent-gold)',
  passive: 'var(--accent-gold)',
  passive_aggressive: 'var(--accent-orange, #ff9100)',
  aggressive: 'var(--accent-red)',
};

const MOTIVATIONAL_MESSAGES = {
  improving: '📈 Twoje wyniki się poprawiają! Widać postęp w rozumieniu wzorców komunikacyjnych.',
  consistent: '💪 Grasz regularnie — konsystencja to klucz do zmiany nawyków.',
  manyRed: '🌱 Konflikty to normalne wyzwanie. Każdy scenariusz uczy Cię czegoś nowego o sobie.',
  highAvg: '⭐ Imponujące wyniki! Twoje podejście do relacji jest wyjątkowo świadome.',
  starting: '🚀 Dobry początek! Każda sesja to krok w stronę lepszego rozumienia siebie.',
};

// ═══════════════════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════════════════

export default function StatsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mn_session_history');
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const totalGames = history.length;

  // Average score as percentage
  const avgPercent = totalGames > 0
    ? history.reduce((sum, h) => sum + ((h.score ?? 0) / (h.maxScore || 1)) * 100, 0) / totalGames
    : 0;

  // Ending distribution (all 4 colors)
  const endingCounts: Record<string, number> = { blue: 0, green: 0, yellow: 0, red: 0 };
  history.forEach(h => {
    if (h.endingColor in endingCounts) {
      endingCounts[h.endingColor]++;
    }
  });

  // Style distribution
  const styleCounts: Partial<Record<CommunicationStyle, number>> = {};
  history.forEach(h => {
    if (h.dominantStyle) {
      styleCounts[h.dominantStyle] = (styleCounts[h.dominantStyle] || 0) + 1;
    }
  });
  const topStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];

  // Activity chart data (last 30 days)
  const activityData = useMemo(() => computeActivityData(history), [history]);

  // Score trend data
  const trendData = useMemo(() => history.map(h => ({
    date: h.date,
    percent: Math.round(((h.score ?? 0) / (h.maxScore || 1)) * 100),
  })), [history]);

  // Streak
  const streak = useMemo(() => computeStreak(history), [history]);

  // Motivational message
  const motivation = useMemo(() => pickMotivation(history, avgPercent, streak), [history, avgPercent, streak]);

  if (totalGames === 0) {
    return (
      <div className="screen fade-in">
        <div className="scroll-area">
          <Header onBack={() => router.push('/menu')} />
          <div className="text-center" style={{ marginTop: 40, color: 'var(--text-dim)' }}>
            Zagraj swoją pierwszą sesję, aby zobaczyć statystyki.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen fade-in">
      <div className="scroll-area">
        <Header onBack={() => router.push('/menu')} />

        {/* ── Activity chart (30 days) ── */}
        <div className="stat-card">
          <SectionTitle>Aktywność (30 dni)</SectionTitle>
          <ActivityChart data={activityData} />
          <div className="text-dim" style={{ fontSize: '0.72rem', marginTop: 8, textAlign: 'center' }}>
            {totalGames} {totalGames === 1 ? 'sesja' : totalGames < 5 ? 'sesje' : 'sesji'} łącznie
            {streak > 1 && <> · 🔥 {streak} dni pod rząd</>}
          </div>
        </div>

        {/* ── Score trend ── */}
        <div className="stat-card">
          <SectionTitle>Trend wyników</SectionTitle>
          <TrendChart data={trendData} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="text-dim" style={{ fontSize: '0.72rem' }}>Średnio: {avgPercent.toFixed(0)}%</span>
            <span className="text-dim" style={{ fontSize: '0.72rem' }}>Ostatni: {trendData[trendData.length - 1]?.percent ?? 0}%</span>
          </div>
        </div>

        {/* ── Ending distribution ── */}
        <div className="stat-card">
          <SectionTitle>Rozkład zakończeń</SectionTitle>
          {Object.entries(ENDING_CONFIG).map(([color, cfg]) => (
            <div className="stat-row" key={color}>
              <span>{cfg.emoji} {cfg.label}</span>
              <span className="text-mono" style={{ color: cfg.color }}>{endingCounts[color] || 0}</span>
            </div>
          ))}
        </div>

        {/* ── Communication style ── */}
        {Object.keys(styleCounts).length > 0 && (
          <div className="stat-card">
            <SectionTitle>🎭 Twój styl komunikacji</SectionTitle>
            {topStyle && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Najczęstszy: <strong style={{ color: STYLE_COLORS[topStyle[0] as CommunicationStyle] || 'var(--text-primary)' }}>
                  {STYLE_LABELS[topStyle[0] as CommunicationStyle] || topStyle[0]}
                </strong>
                {' '}({Math.round((topStyle[1] / totalGames) * 100)}%)
              </div>
            )}
            {Object.entries(styleCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([style, count]) => {
                const pct = Math.round((count / totalGames) * 100);
                const barColor = STYLE_COLORS[style as CommunicationStyle] || 'var(--accent-cyan)';
                return (
                  <div key={style} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                      <span>{STYLE_LABELS[style as CommunicationStyle] || style}</span>
                      <span className="text-mono" style={{ color: barColor }}>{pct}%</span>
                    </div>
                    <div className="trait-bar-track">
                      <div className="trait-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ── Motivational message ── */}
        <div className="card" style={{ padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            {motivation}
          </p>
        </div>

        {/* ── Recent sessions ── */}
        <h3 className="heading-section" style={{ margin: '20px 0 12px' }}>Ostatnie sesje</h3>
        {[...history].reverse().slice(0, 10).map((session, i) => {
          const dateStr = new Date(session.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          const cfg = ENDING_CONFIG[session.endingColor] || ENDING_CONFIG.red;
          const title = session.scenarioTitle || session.scenarioId;
          const pct = Math.round(((session.score ?? 0) / (session.maxScore || 1)) * 100);
          return (
            <div key={i} className="card" style={{ padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ marginRight: 8 }}>{cfg.emoji}</span>
                  <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{title}</span>
                </div>
                <span className="text-mono" style={{ fontSize: '0.8rem', color: cfg.color, flexShrink: 0, marginLeft: 8 }}>
                  {session.score ?? 0}/{session.maxScore} ({pct}%)
                </span>
              </div>
              <div className="text-dim" style={{ fontSize: '0.72rem', marginTop: 4 }}>{dateStr}</div>
            </div>
          );
        })}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════════════

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 16px' }}>
      <button className="back-btn" onClick={onBack}>←</button>
      <h2 className="heading-section">Statystyki</h2>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 12 }}>
      {children}
    </h4>
  );
}

// ── Activity bar chart (30 days) ──

function ActivityChart({ data }: { data: { day: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 60 }}>
      {data.map((d, i) => {
        const h = d.count > 0 ? Math.max(8, (d.count / maxCount) * 56) : 2;
        const bg = d.count > 0 ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)';
        return (
          <div
            key={i}
            title={`${d.day}: ${d.count} sesji`}
            style={{
              flex: 1,
              height: h,
              background: bg,
              borderRadius: 2,
              transition: 'height 0.3s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ── Score trend line chart ──

function TrendChart({ data }: { data: { percent: number }[] }) {
  if (data.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        Zagraj więcej sesji, aby zobaczyć trend
      </div>
    );
  }

  const width = 100;
  const height = 60;
  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * innerW,
    y: padding + innerH - (d.percent / 100) * innerH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  // Area fill
  const areaD = `${pathD} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 80 }} preserveAspectRatio="none">
      {/* Zone backgrounds */}
      <rect x={0} y={0} width={width} height={height * 0.3} fill="rgba(0,229,255,0.03)" />
      <rect x={0} y={height * 0.3} width={width} height={height * 0.3} fill="rgba(255,193,7,0.03)" />
      <rect x={0} y={height * 0.6} width={width} height={height * 0.4} fill="rgba(244,67,54,0.03)" />

      {/* Zone lines */}
      <line x1={0} y1={height * 0.3} x2={width} y2={height * 0.3} stroke="rgba(255,255,255,0.05)" strokeWidth={0.3} />
      <line x1={0} y1={height * 0.6} x2={width} y2={height * 0.6} stroke="rgba(255,255,255,0.05)" strokeWidth={0.3} />

      {/* Area */}
      <path d={areaD} fill="url(#trendGradient)" opacity={0.3} />

      {/* Line */}
      <path d={pathD} fill="none" stroke="var(--accent-cyan)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots for last 3 */}
      {points.slice(-3).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.5} fill="var(--accent-cyan)" />
      ))}

      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//  Utility functions
// ═══════════════════════════════════════════════════════════

function computeActivityData(history: SessionRecord[]): { day: string; count: number }[] {
  const now = new Date();
  const days: { day: string; count: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const count = history.filter(h => h.date?.slice(0, 10) === dayStr).length;
    days.push({ day: dayStr, count });
  }

  return days;
}

function computeStreak(history: SessionRecord[]): number {
  if (history.length === 0) return 0;

  const uniqueDays = new Set(history.map(h => h.date?.slice(0, 10)).filter(Boolean));
  const today = new Date().toISOString().slice(0, 10);

  let streak = 0;
  let current = new Date();

  // Check if played today or yesterday to start streak
  if (!uniqueDays.has(today)) {
    current.setDate(current.getDate() - 1);
    if (!uniqueDays.has(current.toISOString().slice(0, 10))) return 0;
  }

  while (uniqueDays.has(current.toISOString().slice(0, 10))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

function pickMotivation(history: SessionRecord[], avgPercent: number, streak: number): string {
  if (history.length <= 2) return MOTIVATIONAL_MESSAGES.starting;

  // Check if improving (last 3 avg > overall avg)
  const last3 = history.slice(-3);
  const last3Avg = last3.reduce((s, h) => s + ((h.score ?? 0) / (h.maxScore || 1)) * 100, 0) / last3.length;
  if (last3Avg > avgPercent + 5) return MOTIVATIONAL_MESSAGES.improving;

  if (streak >= 3) return MOTIVATIONAL_MESSAGES.consistent;
  if (avgPercent >= 75) return MOTIVATIONAL_MESSAGES.highAvg;

  const redCount = history.filter(h => h.endingColor === 'red').length;
  if (redCount > history.length * 0.5) return MOTIVATIONAL_MESSAGES.manyRed;

  return MOTIVATIONAL_MESSAGES.starting;
}
