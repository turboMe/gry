'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Scenario, Interaction, Scene, Choice, Metrics, CommunicationStyle } from '@/lib/types';
import { applyMetricEffects } from '@/lib/engine/metrics-engine';
import { findEnding, STYLE_LABELS } from '@/lib/engine/game-engine';
import { useAuthStore } from '@/store/game-store';
import { getIdToken } from '@/lib/firebase/auth';

// ═══════════════════════════════════════════════════════════
//  PLAY PAGE — Main gameplay loop
//  State machine: CHARACTER_INTRO → PLAYING → ENDING
// ═══════════════════════════════════════════════════════════

type GamePhase = 'LOADING' | 'CHARACTER_INTRO' | 'PLAYING' | 'FEEDBACK' | 'ENDING';

interface GameState {
  scenario: Scenario;
  currentInteraction: number;
  metrics: Metrics;
  totalScore: number;
  choicesMade: { choiceIndex: number; points: number; style: CommunicationStyle }[];
}

export default function PlayPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<GamePhase>('LOADING');
  const [game, setGame] = useState<GameState | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showReaction, setShowReaction] = useState(false);
  const [choiceRevealed, setChoiceRevealed] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);

  // ── Quit handler ──
  const handleQuit = useCallback(() => setShowQuitModal(true), []);
  const confirmQuit = useCallback(() => {
    sessionStorage.removeItem('mn_active_scenario');
    router.push('/menu');
  }, [router]);
  const cancelQuit = useCallback(() => setShowQuitModal(false), []);

  // Load scenario from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('mn_active_scenario');
    if (!raw) {
      router.replace('/scenarios');
      return;
    }
    const scenario = JSON.parse(raw) as Scenario;
    setGame({
      scenario,
      currentInteraction: 0,
      metrics: { ...scenario.metrics_start },
      totalScore: 0,
      choicesMade: [],
    });
    setPhase('CHARACTER_INTRO');
  }, [router]);

  // ── Juice effects ──
  const spawnParticles = useCallback((color: string, count: number) => {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      const size = Math.random() * 6 + 3;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist = Math.random() * 80 + 40;
      el.style.cssText = `width:${size}px;height:${size}px;background:${color};left:${x}px;top:${y}px;opacity:1;transition:all ${0.6 + Math.random() * 0.4}s cubic-bezier(0.25,0.46,0.45,0.94);`;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px)`;
        el.style.opacity = '0';
      });
      setTimeout(() => el.remove(), 1200);
    }
  }, []);

  const spawnScorePopup = useCallback((pts: number) => {
    const el = document.createElement('div');
    el.className = 'score-popup';
    el.textContent = `+${pts}`;
    el.style.color = pts === 2 ? '#00e676' : '#ffd740';
    el.style.left = (window.innerWidth / 2 - 20) + 'px';
    el.style.top = (window.innerHeight / 2 - 40) + 'px';
    el.style.textShadow = `0 0 20px ${pts === 2 ? 'rgba(0,230,118,0.5)' : 'rgba(255,215,64,0.5)'}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }, []);

  const screenShake = useCallback(() => {
    const c = document.getElementById('__next');
    if (c) {
      c.classList.add('shake');
      setTimeout(() => c.classList.remove('shake'), 300);
    }
    if (navigator.vibrate) navigator.vibrate(50);
  }, []);

  // ── Handle player choice ──
  const handleChoice = useCallback((choiceIndex: number) => {
    if (!game || selectedChoice !== null) return;
    setSelectedChoice(choiceIndex);

    const interaction = game.scenario.interactions[game.currentInteraction];
    const choice = interaction.choices[choiceIndex];

    // Visual effects
    if (choice.points === 0) screenShake();
    if (choice.points > 0) spawnScorePopup(choice.points);
    if (choice.points === 2) spawnParticles('#00e676', 15);

    // Apply metrics after short delay
    setTimeout(() => {
      const newMetrics = applyMetricEffects(game.metrics, choice.metric_effects);
      setGame(prev => prev ? {
        ...prev,
        metrics: newMetrics,
        totalScore: prev.totalScore + choice.points,
        choicesMade: [...prev.choicesMade, {
          choiceIndex,
          points: choice.points,
          style: choice.communication_style,
        }],
      } : null);
      setChoiceRevealed(true);
    }, 400);

    // Show NPC reaction
    setTimeout(() => setShowReaction(true), 400);

    // Show feedback
    setTimeout(() => {
      setShowFeedback(true);
      // Scroll down
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }, 700);
  }, [game, selectedChoice, screenShake, spawnScorePopup, spawnParticles]);

  // ── Go to next interaction or ending ──
  const handleNext = useCallback(() => {
    if (!game) return;
    const isLast = game.currentInteraction >= game.scenario.interactions.length - 1;

    if (isLast) {
      setPhase('ENDING');
    } else {
      setGame(prev => prev ? { ...prev, currentInteraction: prev.currentInteraction + 1 } : null);
      setSelectedChoice(null);
      setShowFeedback(false);
      setShowReaction(false);
      setChoiceRevealed(false);
    }
  }, [game]);

  if (!game || phase === 'LOADING') {
    return (
      <div className="flex-center" style={{ flex: 1 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  // ═══ CHARACTER INTRO ═══
  if (phase === 'CHARACTER_INTRO') {
    return (
      <CharacterIntro
        scenario={game.scenario}
        onStart={() => setPhase('PLAYING')}
        onQuit={handleQuit}
        showQuitModal={showQuitModal}
        onConfirmQuit={confirmQuit}
        onCancelQuit={cancelQuit}
      />
    );
  }

  // ═══ ENDING ═══
  if (phase === 'ENDING') {
    return (
      <EndingScreen
        scenario={game.scenario}
        totalScore={game.totalScore}
        metrics={game.metrics}
        choicesMade={game.choicesMade}
        onReplay={() => {
          setGame({
            scenario: game.scenario,
            currentInteraction: 0,
            metrics: { ...game.scenario.metrics_start },
            totalScore: 0,
            choicesMade: [],
          });
          setPhase('PLAYING');
          setSelectedChoice(null);
          setShowFeedback(false);
          setShowReaction(false);
          setChoiceRevealed(false);
        }}
        onMenu={() => router.push('/menu')}
      />
    );
  }

  // ═══ PLAYING — Main interaction loop ═══
  const rawInteraction = game.scenario.interactions[game.currentInteraction];
  const totalInts = game.scenario.interactions.length;

  // Resolve scene variants based on accumulated score
  const interaction = resolveInteraction(rawInteraction, game.currentInteraction, game.totalScore);

  return (
    <div className="screen">
      {/* Top bar */}
      <div className="interaction-top-bar">
        <div className="interaction-label">INTERAKCJA {game.currentInteraction + 1}/{totalInts}</div>
        <div className="interaction-progress">
          {Array.from({ length: totalInts }).map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${i < game.currentInteraction ? 'progress-dot-done' : i === game.currentInteraction ? 'progress-dot-current' : ''}`}
            />
          ))}
        </div>
        <button className="quit-btn" onClick={handleQuit} title="Przerwij scenariusz" aria-label="Przerwij scenariusz">✕</button>
      </div>

      {/* Quit modal */}
      {showQuitModal && <QuitModal onConfirm={confirmQuit} onCancel={cancelQuit} />}

      {/* Meters */}
      <div className="meters-bar">
        <MeterItem icon="🔥" label="Napięcie" value={game.metrics.tension} fillClass="meter-fill-tension" />
        <MeterItem icon="🤝" label="Zaufanie" value={game.metrics.trust} fillClass="meter-fill-trust" />
        <MeterItem icon="💬" label="Dialog" value={game.metrics.openness} fillClass="meter-fill-openness" />
        <MeterItem icon="👂" label="Słuchanie" value={game.metrics.feeling_heard} fillClass="meter-fill-heard" />
      </div>

      {/* Scrollable content */}
      <div className="scroll-area" ref={scrollRef}>
        <div style={{ padding: '20px 0' }}>
          {/* Scene title */}
          <div className="heading-display" style={{ fontSize: '1.2rem', marginBottom: 4 }}>{interaction.title}</div>
          <div className="text-dim" style={{ fontSize: '0.8rem', marginBottom: 16 }}>Interakcja {game.currentInteraction + 1} z {totalInts}</div>

          {/* Comic panel */}
          <div className="comic-panel">
            <div className="panel-illustration">
              <SceneIllustration mood={interaction.scene.visual_mood} />
            </div>
            <div className="panel-situation" dangerouslySetInnerHTML={{ __html: interaction.scene.description.replace(/\*(.*?)\*/g, '<em>$1</em>') }} />

            {/* NPC speech or stage direction */}
            {interaction.npc_line ? (
              <div style={{ padding: '0 18px 18px' }}>
                <div className="speech-bubble">
                  <div className="speaker">{game.scenario.characters.npc.name}</div>
                  {interaction.npc_line}
                </div>
              </div>
            ) : interaction.npc_stage_direction ? (
              <div style={{ padding: '0 18px 18px' }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  {interaction.npc_stage_direction}
                </div>
              </div>
            ) : null}
          </div>

          {/* Choices */}
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-dim)', marginBottom: 10 }}>
            CO ODPOWIADASZ?
          </div>
          <div>
            {interaction.choices.map((choice, i) => {
              let cardClass = 'choice-card';
              if (selectedChoice === i) cardClass += ' choice-card-selected';
              if (choiceRevealed) {
                cardClass += ' choice-card-disabled';
                if (choice.points === 2) cardClass += ' choice-card-best';
                else if (choice.points === 1) cardClass += ' choice-card-good';
                else cardClass += ' choice-card-bad';
              }

              return (
                <div
                  key={choice.choice_id}
                  className={cardClass}
                  onClick={() => handleChoice(i)}
                >
                  <div className="choice-letter">{choice.choice_id}</div>
                  <div className="choice-text">{choice.text}</div>
                </div>
              );
            })}
          </div>

          {/* NPC Reaction */}
          {showReaction && selectedChoice !== null && (
            <div style={{ padding: '10px 0' }}>
              <div className="npc-reaction-bubble">
                <div className="speaker">{game.scenario.characters.npc.name}</div>
                {interaction.choices[selectedChoice].npc_reaction}
              </div>
            </div>
          )}

          {/* Feedback Panel */}
          {showFeedback && selectedChoice !== null && (
            <FeedbackPanel
              choice={interaction.choices[selectedChoice]}
              totalScore={game.totalScore}
              maxScore={game.scenario.interactions.length * 2}
            />
          )}

          {/* Next button */}
          {showFeedback && (
            <div style={{ padding: '10px 0 40px' }}>
              <button className="btn-continue" onClick={handleNext}>
                {game.currentInteraction >= totalInts - 1 ? 'ZOBACZ ZAKOŃCZENIE →' : 'NASTĘPNA SCENA →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ Sub-components ═══

function MeterItem({ icon, label, value, fillClass }: { icon: string; label: string; value: number; fillClass: string }) {
  return (
    <div className="meter-item">
      <div className="meter-icon">{icon}</div>
      <div className="meter-label">{label}</div>
      <div className="meter-track">
        <div className={`meter-fill ${fillClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const MOOD_GRADIENTS: Record<string, string> = {
  warm:    'linear-gradient(135deg, rgba(62,40,22,0.45), rgba(46,26,26,0.45))',
  cold:    'linear-gradient(135deg, rgba(22,33,64,0.45), rgba(26,26,46,0.45))',
  tense:   'linear-gradient(135deg, rgba(62,22,32,0.45), rgba(46,26,26,0.45))',
  neutral: 'linear-gradient(135deg, rgba(22,33,62,0.45), rgba(26,26,46,0.45))',
  dark:    'linear-gradient(135deg, rgba(16,16,32,0.55), rgba(12,12,20,0.55))',
  hopeful: 'linear-gradient(135deg, rgba(22,62,32,0.45), rgba(26,46,26,0.45))',
};

function SceneIllustration({ mood }: { mood: string }) {
  const gradient = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.neutral;

  return (
    <div className="scene-illustration">
      <img
        src="/icons/icon-512.png"
        alt=""
        className="scene-icon"
        draggable={false}
      />
      <div className="scene-mood-overlay" style={{ background: gradient }} />
    </div>
  );
}

function QuitModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="quit-overlay" onClick={onCancel}>
      <div className="quit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quit-modal-icon">⏸️</div>
        <h3 className="quit-modal-title">Przerwać scenariusz?</h3>
        <p className="quit-modal-desc">Postęp nie zostanie zapisany. Czy na pewno chcesz wyjść?</p>
        <div className="quit-modal-actions">
          <button className="quit-modal-btn quit-modal-btn-cancel" onClick={onCancel}>Graj dalej</button>
          <button className="quit-modal-btn quit-modal-btn-confirm" onClick={onConfirm}>Wyjdź</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Resolve dynamic scene variants for an interaction.
 * INT_1 always uses single scene/npc_line.
 * INT_2+ selects scene_low or scene_high based on accumulated score vs threshold.
 */
function resolveInteraction(
  raw: Interaction,
  interactionIndex: number,
  accumulatedScore: number
): Interaction & { scene: Scene; npc_line: string | null } {
  // If this interaction has scene variants (INT_2+)
  if (interactionIndex > 0 && raw.scene_low && raw.scene_high) {
    const threshold = raw.score_threshold ?? interactionIndex;
    if (accumulatedScore >= threshold) {
      return { ...raw, scene: raw.scene_high, npc_line: raw.npc_line_high ?? null };
    } else {
      return { ...raw, scene: raw.scene_low, npc_line: raw.npc_line_low ?? null };
    }
  }
  // Fallback: use single scene (INT_1 or old-format scenarios)
  return raw as Interaction & { scene: Scene; npc_line: string | null };
}

function FeedbackPanel({ choice, totalScore, maxScore }: { choice: Choice; totalScore: number; maxScore: number }) {
  const qualClass = choice.points === 2 ? 'best' : choice.points === 1 ? 'good' : 'bad';
  const icon = choice.points === 2 ? '★' : choice.points === 1 ? '✓' : '⚠️';

  return (
    <div className="feedback-panel">
      <div className="feedback-verdict">
        <div className={`verdict-icon verdict-icon-${qualClass}`}>{icon}</div>
        <div className={`verdict-text verdict-text-${qualClass}`}>{choice.feedback.label}</div>
      </div>

      <div className="text-mono" style={{ fontSize: '0.8rem', marginBottom: 12, color: 'var(--text-dim)' }}>
        +<span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>{choice.points}</span>{' '}
        {choice.points === 1 ? 'punkt' : 'punkty'} · Wynik:{' '}
        <span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>{totalScore}/{maxScore}</span>
      </div>

      <div style={{ fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
        {choice.feedback.psychology}
      </div>

      {choice.feedback.better_alternative_hint && (
        <div className="feedback-hint">💡 {choice.feedback.better_alternative_hint}</div>
      )}

      {choice.tags && choice.tags.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {choice.tags.map((tag, i) => (
            <span key={i} className={`psych-tag psych-tag-${tag.type}`}>{tag.text}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function CharacterIntro({ scenario, onStart, onQuit, showQuitModal, onConfirmQuit, onCancelQuit }: {
  scenario: Scenario; onStart: () => void; onQuit: () => void;
  showQuitModal: boolean; onConfirmQuit: () => void; onCancelQuit: () => void;
}) {
  const player = scenario.characters.player;
  const npc = scenario.characters.npc;

  return (
    <div className="screen fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0', flexShrink: 0 }}>
        <button className="quit-btn" onClick={onQuit} title="Przerwij scenariusz" aria-label="Przerwij scenariusz">✕</button>
      </div>
      {showQuitModal && <QuitModal onConfirm={onConfirmQuit} onCancel={onCancelQuit} />}
      <div className="scroll-area">
        <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
          <h2 className="heading-display" style={{ fontSize: '1.6rem', marginBottom: 6 }}>Profile Postaci</h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Poznaj obie strony konfliktu</p>
        </div>

        {/* Player card */}
        <div className="card" style={{ marginBottom: 16, padding: 20 }}>
          <div className="card-label">👤 Twoja Rola</div>
          <div className="heading-display" style={{ fontSize: '1.3rem', marginBottom: 4 }}>{player.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: 12 }}>{player.role_label}</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{player.context}</div>
          <div style={{ marginTop: 10 }}>
            {player.traits.map((t, i) => (
              <span key={i} className={`trait-tag trait-tag-${t.type}`}>{t.text}</span>
            ))}
          </div>
          <div className="hidden-need">🔑 Ukryta potrzeba: {player.hidden_need_text}</div>
        </div>

        {/* NPC card */}
        <div className="card" style={{ marginBottom: 16, padding: 20 }}>
          <div className="card-label">🗣️ Twój rozmówca</div>
          <div className="heading-display" style={{ fontSize: '1.3rem', marginBottom: 4 }}>{npc.name}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: 12 }}>{npc.role_label}</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{npc.context}</div>
          <div style={{ marginTop: 10 }}>
            {npc.traits.map((t, i) => (
              <span key={i} className={`trait-tag trait-tag-${t.type}`}>{t.text}</span>
            ))}
          </div>
          <div className="hidden-need">🔑 Ukryta potrzeba: {npc.hidden_need_text}</div>
        </div>

        <button className="btn-continue" onClick={onStart} style={{ marginBottom: 30 }}>PRZEJDŹ DO SCENY →</button>
      </div>
    </div>
  );
}

function EndingScreen({ scenario, totalScore, metrics, choicesMade, onReplay, onMenu }: {
  scenario: Scenario;
  totalScore: number;
  metrics: Metrics;
  choicesMade: { choiceIndex: number; points: number; style: CommunicationStyle }[];
  onReplay: () => void;
  onMenu: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const maxScore = scenario.interactions.length * 2;
  const ending = findEnding(scenario, totalScore);

  // Dominant style (needed for cloud save)
  const styleCounts: Record<string, number> = {};
  choicesMade.forEach(c => { styleCounts[c.style] = (styleCounts[c.style] || 0) + 1; });
  const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as CommunicationStyle;

  // Save session to localStorage + Firestore
  useEffect(() => {
    if (!ending) return;
    try {
      const history = JSON.parse(localStorage.getItem('mn_session_history') || '[]');
      history.push({
        scenarioId: scenario.scenario_id,
        date: new Date().toISOString(),
        score: totalScore,
        maxScore,
        endingColor: ending.color,
        endingId: ending.ending_id,
        choices: choicesMade.map(c => c.choiceIndex),
      });
      localStorage.setItem('mn_session_history', JSON.stringify(history.slice(-100)));
    } catch { /* ignore */ }

    // Sync to Firestore if logged in
    if (user) {
      getIdToken().then(token => {
        if (!token) return;
        fetch('/api/sessions/save-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            scenario_id: scenario.scenario_id,
            total_score: totalScore,
            max_possible_score: maxScore,
            ending_id: ending.ending_id,
            ending_color: ending.color,
            dominant_style: dominantStyle,
            metrics_final: metrics,
          }),
        }).catch(() => { /* non-critical */ });
      });
    }
  }, [ending, scenario, totalScore, maxScore, choicesMade, user, dominantStyle, metrics]);

  // Update profile
  useEffect(() => {
    try {
      const raw = localStorage.getItem('mn_player_profile');
      if (!raw) return;
      const profile = JSON.parse(raw);
      for (const choice of choicesMade) {
        if (choice.style === 'empathic') {
          profile.empathy = Math.min(10, profile.empathy + 0.2);
          profile.repair_ability = Math.min(10, profile.repair_ability + 0.1);
        }
        if (choice.style === 'aggressive') {
          profile.impulsiveness = Math.min(10, profile.impulsiveness + 0.1);
        }
        if (choice.style === 'assertive') {
          profile.directness = Math.min(10, profile.directness + 0.1);
        }
      }
      for (const k of Object.keys(profile)) {
        profile[k] = Math.round(profile[k] * 10) / 10;
      }
      localStorage.setItem('mn_player_profile', JSON.stringify(profile));

      // Sync updated profile to Firestore
      if (user) {
        getIdToken().then(token => {
          if (!token) return;
          fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ traits: profile }),
          }).catch(() => { /* non-critical */ });
        });
      }
    } catch { /* ignore */ }
  }, [choicesMade, user]);

  // Confetti for green ending
  useEffect(() => {
    if (!ending || ending.color !== 'green') return;
    const timer = setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight * 0.5;
          const colors = ['#00e676', '#ffd740', '#00e5ff'];
          const color = colors[Math.floor(Math.random() * 3)];
          for (let j = 0; j < 10; j++) {
            const el = document.createElement('div');
            el.className = 'particle';
            const size = Math.random() * 6 + 3;
            const angle = (Math.PI * 2 * j) / 10 + (Math.random() - 0.5) * 0.5;
            const dist = Math.random() * 80 + 40;
            el.style.cssText = `width:${size}px;height:${size}px;background:${color};left:${x}px;top:${y}px;opacity:1;transition:all 0.8s cubic-bezier(0.25,0.46,0.45,0.94);`;
            document.body.appendChild(el);
            requestAnimationFrame(() => {
              el.style.transform = `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px)`;
              el.style.opacity = '0';
            });
            setTimeout(() => el.remove(), 1200);
          }
        }, i * 200);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [ending]);

  if (!ending) return null;

  // Check new best
  let isNewBest = false;
  try {
    const history = JSON.parse(localStorage.getItem('mn_session_history') || '[]');
    const previous = history.filter((h: { scenarioId: string }) => h.scenarioId === scenario.scenario_id);
    if (previous.length > 1) {
      const prevBest = Math.max(...previous.slice(0, -1).map((h: { score: number }) => h.score));
      isNewBest = totalScore > prevBest;
    }
  } catch { /* ignore */ }

  return (
    <div className="screen fade-in">
      <div className="scroll-area" style={{ paddingTop: 20 }}>
        <div style={{ padding: '30px 0 50px', textAlign: 'center' }}>
          {isNewBest && <div className="new-best-banner">🏆 NOWY REKORD!</div>}

          <div className={`ending-badge ending-badge-${ending.color}`}>{ending.emoji || '🏁'}</div>
          <div className={`heading-display ending-title-${ending.color}`} style={{ fontSize: '1.6rem', marginBottom: 6 }}>{ending.title}</div>
          {ending.subtitle && <div className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: 6 }}>{ending.subtitle}</div>}
          <div className="text-mono text-dim" style={{ fontSize: '1rem', marginBottom: 20 }}>
            <span style={{ color: 'var(--accent-cyan)' }}>{totalScore}</span> / {maxScore} punktów
          </div>

          {/* Choice dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
            {choicesMade.map((c, i) => (
              <div key={i} className={`choice-dot choice-dot-${c.points}`}>{c.points}</div>
            ))}
          </div>

          {/* Narrative */}
          <div className="card" style={{ maxWidth: 400, margin: '20px auto', textAlign: 'left', fontStyle: 'italic', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {ending.narrative}
          </div>

          {/* Diagnosis */}
          <div className="card" style={{ maxWidth: 400, margin: '0 auto 20px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 10 }}>🧠 Analiza psychologiczna</h4>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{ending.diagnosis}</p>
          </div>

          {/* Style */}
          <div className="card" style={{ maxWidth: 400, margin: '0 auto 20px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 10 }}>💬 Twój styl w tej sesji</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Dominujący styl: <strong style={{ color: 'var(--accent-cyan)' }}>{STYLE_LABELS[dominantStyle] || dominantStyle}</strong>
            </p>
          </div>

          {/* Growth tip */}
          <div className="card" style={{ maxWidth: 400, margin: '0 auto 20px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 10 }}>💡 Rada na przyszłość</h4>
            <p style={{ color: 'var(--accent-gold)', fontSize: '0.88rem' }}>{ending.post_game?.growth_tip || scenario.post_game?.growth_tip || ''}</p>
          </div>

          {/* Final metrics */}
          <div className="card" style={{ maxWidth: 400, margin: '0 auto 20px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 10 }}>📊 Wskaźniki końcowe</h4>
            <MetricRow icon="🔥" label="Napięcie" value={metrics.tension} color="var(--tension-color)" />
            <MetricRow icon="🤝" label="Zaufanie" value={metrics.trust} color="var(--trust-color)" />
            <MetricRow icon="💬" label="Otwartość" value={metrics.openness} color="var(--openness-color)" />
            <MetricRow icon="👂" label="Słuchanie" value={metrics.feeling_heard} color="var(--heard-color)" />
          </div>

          {/* Actions */}
          <div style={{ marginTop: 24 }}>
            <button className="btn-restart" onClick={onReplay}>↻ ZAGRAJ PONOWNIE</button>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 12 }}>{ending.post_game?.replay_prompt || scenario.post_game?.replay_prompt || ''}</div>
          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={onMenu} style={{ maxWidth: 300, margin: '0 auto' }}>
              <span className="btn-icon">🏠</span>
              <span className="btn-label">Menu główne</span>
            </button>
          </div>
          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
}

function MetricRow({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{icon} {label}</span>
        <span className="text-mono" style={{ fontSize: '0.8rem', color }}>{Math.round(value)}%</span>
      </div>
      <div className="meter-track" style={{ marginBottom: 12 }}>
        <div className="meter-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </>
  );
}
