// ═══════════════════════════════════════════════════════════
//  PROGRESSION ENGINE
//  Handles scenario unlocking based on player progress.
// ═══════════════════════════════════════════════════════════

import type { Difficulty, ScenarioCatalogEntry } from '@/lib/types';
import type { UserStats } from '@/lib/types/user';

/** Minimum completed sessions to unlock each difficulty tier */
const DIFFICULTY_GATES: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 3,
  advanced: 10,
  expert: 20,
};

export interface UnlockStatus {
  unlocked: boolean;
  reason?: string;
  sessions_needed?: number;
  required_scenarios_missing?: string[];
}

/**
 * Check if a scenario is unlocked for a given player.
 */
export function checkScenarioUnlock(
  scenario: ScenarioCatalogEntry,
  stats: UserStats | null
): UnlockStatus {
  const completedSessions = stats?.completed_sessions ?? 0;
  const completedScenarios = stats?.scenarios_completed ?? [];

  // 1. Check difficulty gate
  const requiredSessions = DIFFICULTY_GATES[scenario.tags.difficulty] ?? 0;
  if (completedSessions < requiredSessions) {
    return {
      unlocked: false,
      reason: `Wymaga ${requiredSessions} ukończonych sesji (masz: ${completedSessions})`,
      sessions_needed: requiredSessions - completedSessions,
    };
  }

  // 2. Check specific scenario requirements
  const req = scenario.unlock_requirements;
  if (req) {
    // Min sessions requirement
    if (req.min_sessions && completedSessions < req.min_sessions) {
      return {
        unlocked: false,
        reason: `Wymaga ${req.min_sessions} ukończonych sesji`,
        sessions_needed: req.min_sessions - completedSessions,
      };
    }

    // Required scenarios
    if (req.required_scenarios && req.required_scenarios.length > 0) {
      const missing = req.required_scenarios.filter(
        sid => !completedScenarios.includes(sid)
      );
      if (missing.length > 0) {
        return {
          unlocked: false,
          reason: `Wymaga ukończenia scenariuszy: ${missing.join(', ')}`,
          required_scenarios_missing: missing,
        };
      }
    }
  }

  return { unlocked: true };
}

/**
 * Enrich scenario catalog entries with unlock status and user data.
 */
export function enrichScenarioCatalog(
  scenarios: ScenarioCatalogEntry[],
  stats: UserStats | null,
  bestScores: Record<string, number>,
  subscriptionTier: 'free' | 'premium'
): ScenarioCatalogEntry[] {
  return scenarios.map(s => {
    const unlock = checkScenarioUnlock(s, stats);
    const isPaywalled = !s.is_free && subscriptionTier === 'free';

    return {
      ...s,
      locked: !unlock.unlocked || isPaywalled,
      completed: stats?.scenarios_completed?.includes(s.scenario_id) ?? false,
      best_score: bestScores[s.scenario_id] ?? null,
    };
  });
}

/**
 * Get the difficulty label in Polish.
 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Początkujący',
  intermediate: 'Średnio zaawansowany',
  advanced: 'Zaawansowany',
  expert: 'Ekspert',
};
