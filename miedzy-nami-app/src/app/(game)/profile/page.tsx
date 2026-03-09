'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TRAIT_NAMES } from '@/lib/engine/profile-quiz';
import type { PsychologicalProfile } from '@/lib/types';

/**
 * Player Profile page — shows psychological trait bars.
 */
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PsychologicalProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mn_player_profile');
      if (raw) setProfile(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  if (!profile) {
    return (
      <div className="screen fade-in" >
        <div className="scroll-area">
          <Header onBack={() => router.push('/menu')} title="Twój profil" />
          <div className="text-center" style={{ marginTop: 40 }}>
            <p className="text-dim">Ukończ quiz, aby zobaczyć swój profil.</p>
            <button className="btn-continue" onClick={() => router.push('/quiz')} style={{ maxWidth: 300, margin: '20px auto' }}>
              Rozpocznij quiz →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const traits = (Object.entries(profile) as [keyof PsychologicalProfile, number][])
    .filter(([_, v]) => typeof v === 'number' && v !== null);

  // Strengths and weaknesses
  const sorted = [...traits].sort((a, b) => b[1] - a[1]);
  const strengths = sorted.filter(([_, v]) => v >= 7);
  const weaknesses = sorted.filter(([_, v]) => v <= 3);

  return (
    <div className="screen fade-in" >
      <div className="scroll-area">
        <Header onBack={() => router.push('/menu')} title="Twój profil" />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="heading-display" style={{ fontSize: '1.5rem', marginBottom: 6 }}>Profil Komunikacyjny</div>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Ewoluuje po każdej sesji</p>
        </div>

        {/* Trait bars */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          {traits.map(([trait, value]) => (
            <div key={trait} className="trait-bar-group">
              <div className="trait-bar-label">
                <span className="trait-bar-name">{TRAIT_NAMES[trait]}</span>
                <span className="trait-bar-value">{(value ?? 0).toFixed(1)}/10</span>
              </div>
              <div className="trait-bar-track">
                <div className="trait-bar-fill" style={{ width: `${((value ?? 0) / 10) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-green)', marginBottom: 10 }}>
              💪 Mocne strony
            </h4>
            {strengths.map(([trait, value]) => (
              <div key={trait} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                • {TRAIT_NAMES[trait]} ({(value ?? 0).toFixed(1)})
              </div>
            ))}
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-orange)', marginBottom: 10 }}>
              🎯 Obszary do rozwoju
            </h4>
            {weaknesses.map(([trait, value]) => (
              <div key={trait} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                • {TRAIT_NAMES[trait]} ({(value ?? 0).toFixed(1)})
              </div>
            ))}
          </div>
        )}

        <button className="btn" onClick={() => router.push('/quiz')} style={{ maxWidth: 400, margin: '0 auto 16px' }}>
          <span className="btn-icon">🔄</span>
          <span className="btn-label">Powtórz quiz</span>
        </button>
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
