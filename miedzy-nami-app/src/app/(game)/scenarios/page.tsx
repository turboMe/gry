'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Scenario } from '@/lib/types';
import { RELATIONSHIP_CATEGORIES } from '@/lib/engine/scenario-matcher';

/**
 * Scenario Browser — browse and select scenarios to play.
 * MVP version: loads from local JSON, grouped by relationship type.
 */
export default function ScenariosPage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const resp = await fetch('/api/scenarios');
        if (resp.ok) {
          const data = await resp.json();
          setScenarios(data.scenarios as Scenario[]);
        }
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      }
      setLoading(false);
    }
    loadScenarios();
  }, []);

  const handleSelectScenario = (scenario: Scenario) => {
    // Store scenario in sessionStorage for the play page
    sessionStorage.setItem('mn_active_scenario', JSON.stringify(scenario));
    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/play/${sessionId}`);
  };

  // Group scenarios by relationship type
  const groups: Record<string, Scenario[]> = {};
  scenarios.forEach(s => {
    const rt = s.tags.relationship_type;
    if (!groups[rt]) groups[rt] = [];
    groups[rt].push(s);
  });

  if (loading) {
    return (
      <div className="screen fade-in" >
        <div className="scroll-area">
          <Header onBack={() => router.push('/menu')} title="Wybierz scenariusz" />
          <div className="loading-spinner" />
          <p className="text-center text-dim">Ładowanie scenariuszy...</p>
        </div>
      </div>
    );
  }

  // Category view
  if (!selectedCategory) {
    return (
      <div className="screen fade-in" >
        <div className="scroll-area">
          <Header onBack={() => router.push('/menu')} title="Wybierz relację" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {Object.entries(groups).map(([rt, list]) => {
              const cat = RELATIONSHIP_CATEGORIES[rt as keyof typeof RELATIONSHIP_CATEGORIES] || { icon: '📁', name: rt };
              return (
                <div
                  key={rt}
                  className="category-card"
                  onClick={() => setSelectedCategory(rt)}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{cat.icon}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{cat.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    {list.length} {list.length === 1 ? 'scenariusz' : 'scenariuszy'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Scenario list view
  const list = groups[selectedCategory] || [];
  const catInfo = RELATIONSHIP_CATEGORIES[selectedCategory as keyof typeof RELATIONSHIP_CATEGORIES] || { icon: '📁', name: selectedCategory };

  return (
    <div className="screen fade-in" >
      <div className="scroll-area">
        <Header
          onBack={() => setSelectedCategory(null)}
          title={`${catInfo.icon} ${catInfo.name}`}
        />

        <div className="flex-col">
          {list.map(s => {
            // Check for best score from localStorage
            let bestScore: number | null = null;
            try {
              const history = JSON.parse(localStorage.getItem('mn_session_history') || '[]');
              const sessions = history.filter((h: { scenarioId: string }) => h.scenarioId === s.scenario_id);
              if (sessions.length > 0) {
                bestScore = Math.max(...sessions.map((h: { score: number }) => h.score));
              }
            } catch { /* ignore */ }

            const maxPts = s.interactions.length * 2;
            const diffClass = `tag-${s.tags.difficulty || 'beginner'}`;

            return (
              <div
                key={s.scenario_id}
                className="scenario-card"
                onClick={() => handleSelectScenario(s)}
              >
                <div className="heading-display" style={{ fontSize: '1.05rem', marginBottom: 4 }}>
                  {s.metadata.title}
                </div>
                <div className="text-secondary" style={{ fontSize: '0.82rem', marginBottom: 10, lineHeight: 1.4 }}>
                  {s.metadata.subtitle}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`tag ${diffClass}`}>{s.tags.difficulty || 'beginner'}</span>
                  <span className="tag">⏱ {s.metadata.estimated_duration_minutes} min</span>
                  <span className="tag">{s.metadata.interaction_count} interakcji</span>
                  {bestScore !== null && (
                    <span className="text-mono" style={{ fontSize: '0.72rem', color: 'var(--accent-green)' }}>
                      ✅ Najlepszy: {bestScore}/{maxPts}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 16px' }}>
      <button className="back-btn" onClick={onBack}>←</button>
      <h2 className="heading-section">{title}</h2>
    </div>
  );
}
