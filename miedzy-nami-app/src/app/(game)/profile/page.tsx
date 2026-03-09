'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TRAIT_NAMES, POSITIVE_TRAITS, NEGATIVE_TRAITS } from '@/lib/engine/profile-quiz';
import type { PsychologicalProfile } from '@/lib/types';

// ═══════════════════════════════════════════════════════════
//  MOTIVATIONAL QUOTES — rotated per visit
// ═══════════════════════════════════════════════════════════
const MOTIVATIONAL_QUOTES = [
  'Zmiany w naszym życiu przychodzą powoli — dokładnie tak, jak tutaj. Rozwiązuj scenariusze i ucz się nowych wzorców. Nikt nie zbudował Rzymu w jeden dzień 😊',
  'Nie chodzi o to, żeby być idealnym. Chodzi o to, żeby zauważyć, kiedy reagujesz automatycznie — i dać sobie szansę na inny wybór.',
  'Każdy scenariusz, który przechodzisz, to jedno małe ćwiczenie świadomości. Z czasem te drobiazgi sumują się w prawdziwą zmianę.',
  'To, że widzisz swoje bariery, jest już krokiem naprzód. Większość ludzi nigdy się nie zatrzymuje, żeby o tym pomyśleć.',
  'Profil nie ocenia cię jako osobę. Pokazuje, gdzie jesteś dziś — i dokąd możesz dojść jutro.',
];

/**
 * Player Profile page — redesigned with two sections:
 * Resources (higher = better) and Barriers (lower = better).
 * Shows accumulated deltas since last visit.
 */
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PsychologicalProfile | null>(null);
  const [deltas, setDeltas] = useState<Partial<Record<keyof PsychologicalProfile, number>>>({});

  // Random quote — stable per page visit
  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    []
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mn_player_profile');
      if (!raw) return;

      const parsed = JSON.parse(raw);

      // Validate — only accept objects with known trait keys, ignore corrupted data
      const validProfile: PsychologicalProfile = {
        impulsiveness: typeof parsed.impulsiveness === 'number' ? parsed.impulsiveness : 5,
        patience: typeof parsed.patience === 'number' ? parsed.patience : 5,
        defensiveness: typeof parsed.defensiveness === 'number' ? parsed.defensiveness : 5,
        empathy: typeof parsed.empathy === 'number' ? parsed.empathy : 5,
        need_for_control: typeof parsed.need_for_control === 'number' ? parsed.need_for_control : 5,
        shame_sensitivity: typeof parsed.shame_sensitivity === 'number' ? parsed.shame_sensitivity : 5,
        directness: typeof parsed.directness === 'number' ? parsed.directness : 5,
        repair_ability: typeof parsed.repair_ability === 'number' ? parsed.repair_ability : 5,
      };

      setProfile(validProfile);

      // Calculate deltas from last seen snapshot
      const snapshotRaw = localStorage.getItem('mn_profile_last_seen');
      if (snapshotRaw) {
        const snapshot = JSON.parse(snapshotRaw);
        const d: Partial<Record<keyof PsychologicalProfile, number>> = {};
        for (const key of [...POSITIVE_TRAITS, ...NEGATIVE_TRAITS]) {
          if (typeof snapshot[key] === 'number') {
            const diff = Math.round((validProfile[key] - snapshot[key]) * 10) / 10;
            if (diff !== 0) d[key] = diff;
          }
        }
        setDeltas(d);
      }

      // Save current values as new snapshot
      localStorage.setItem('mn_profile_last_seen', JSON.stringify(validProfile));
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

  return (
    <div className="screen fade-in" >
      <div className="scroll-area">
        <Header onBack={() => router.push('/menu')} title="Twój profil" />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="heading-display" style={{ fontSize: '1.5rem', marginBottom: 6 }}>Profil Komunikacyjny</div>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Ewoluuje po każdej sesji</p>
        </div>

        {/* ── Section 1: Resources (higher = better) ── */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-green)', marginBottom: 4 }}>
            💪 Twoje zasoby
          </h4>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
            Więcej znaczy lepiej
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 16 }}>
            Im wyższy wynik, tym lepiej radzisz sobie z tymi wyzwaniami
          </div>

          {POSITIVE_TRAITS.map(trait => (
            <TraitBar
              key={trait}
              trait={trait}
              value={profile[trait]}
              delta={deltas[trait]}
              isPositive={true}
            />
          ))}
        </div>

        {/* ── Section 2: Barriers (lower = better) ── */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-orange)', marginBottom: 4 }}>
            🎯 Nad czym pracujesz
          </h4>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
            Mniej znaczy lepiej
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 16 }}>
            Im niższy wynik, tym lepiej radzisz sobie z tymi wyzwaniami
          </div>

          {NEGATIVE_TRAITS.map(trait => (
            <TraitBar
              key={trait}
              trait={trait}
              value={profile[trait]}
              delta={deltas[trait]}
              isPositive={false}
            />
          ))}
        </div>

        {/* ── Motivational quote ── */}
        <div className="card" style={{ padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: 8 }}>💡</div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            „{quote}"
          </p>
        </div>

        <button className="btn" onClick={() => router.push('/quiz')} style={{ maxWidth: 400, margin: '0 auto 16px' }}>
          <span className="btn-icon">🔄</span>
          <span className="btn-label">Powtórz quiz</span>
        </button>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ═══ Sub-components ═══

function TraitBar({ trait, value, delta, isPositive }: {
  trait: keyof PsychologicalProfile;
  value: number;
  delta?: number;
  isPositive: boolean;
}) {
  // Determine if this delta is "good" given the trait group
  // Positive traits: + is good, - is bad
  // Negative traits: - is good, + is bad
  const deltaColor = delta
    ? (isPositive ? (delta > 0 ? 'var(--accent-green)' : 'var(--accent-orange)') : (delta < 0 ? 'var(--accent-green)' : 'var(--accent-orange)'))
    : undefined;

  const deltaText = delta
    ? `${delta > 0 ? '↑' : '↓'}${Math.abs(delta).toFixed(1)}`
    : null;

  const barColor = isPositive ? 'var(--accent-cyan)' : 'var(--accent-orange, #ff9100)';

  return (
    <div className="trait-bar-group">
      <div className="trait-bar-label">
        <span className="trait-bar-name">{TRAIT_NAMES[trait]}</span>
        <span className="trait-bar-value">
          {(value ?? 0).toFixed(1)}/10
          {deltaText && (
            <span style={{ fontSize: '0.7rem', marginLeft: 6, color: deltaColor, fontWeight: 600 }}>
              {deltaText}
            </span>
          )}
        </span>
      </div>
      <div className="trait-bar-track">
        <div
          className="trait-bar-fill"
          style={{ width: `${((value ?? 0) / 10) * 100}%`, background: barColor }}
        />
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
