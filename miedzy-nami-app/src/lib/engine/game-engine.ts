// ═══════════════════════════════════════════════════════════
//  GAME ENGINE
//  Core game logic — processes choices, calculates endings.
//  Pure functions — used server-side in API routes.
// ═══════════════════════════════════════════════════════════

import type {
  Scenario, Metrics, CommunicationStyle,
  Ending, Choice, PostGame,
} from '@/lib/types';
import type { ChoiceRecord, ChoiceResult, GameSession } from '@/lib/types/session';
import { applyMetricEffects } from './metrics-engine';

/**
 * Process a player's choice for a given interaction.
 * This is the core gameplay function — called from POST /api/sessions/[id]/choice.
 */
export function processChoice(
  scenario: Scenario,
  session: GameSession,
  interactionIndex: number,
  choiceId: 'A' | 'B' | 'C' | 'D'
): ChoiceResult {
  const interaction = scenario.interactions[interactionIndex];
  if (!interaction) {
    throw new Error(`Interaction index ${interactionIndex} out of range`);
  }

  const choiceIndex = ['A', 'B', 'C', 'D'].indexOf(choiceId);
  const choice: Choice = interaction.choices[choiceIndex];
  if (!choice) {
    throw new Error(`Invalid choice_id: ${choiceId}`);
  }

  // 1. Apply metric effects
  const metricsUpdated = applyMetricEffects(session.metrics_current, choice.metric_effects);

  // 2. Build choice record
  const choiceRecord: ChoiceRecord = {
    interaction_id: interaction.interaction_id,
    choice_id: choiceId,
    choice_index: choiceIndex,
    points: choice.points,
    communication_style: choice.communication_style,
    metric_effects_applied: choice.metric_effects,
  };

  // 3. Calculate running total
  const totalScore = session.total_score + choice.points;

  // 4. Check if last interaction
  const isLast = interactionIndex >= scenario.interactions.length - 1;

  // 5. Calculate ending if last
  let ending: ChoiceResult['ending'] = undefined;
  if (isLast) {
    const endingData = findEnding(scenario, totalScore);
    if (endingData) {
      ending = {
        ending_id: endingData.ending_id,
        color: endingData.color,
        title: endingData.title,
        emoji: endingData.emoji,
        subtitle: endingData.subtitle,
        narrative: endingData.narrative,
        diagnosis: endingData.diagnosis,
        post_game: endingData.post_game,
      };
    }
  }

  // 6. Reveal all choices for this interaction
  const allChoicesRevealed = interaction.choices.map(c => ({
    choice_id: c.choice_id,
    points: c.points,
    communication_style: c.communication_style,
  }));

  return {
    choice_record: choiceRecord,
    npc_reaction: choice.npc_reaction,
    feedback: {
      label: choice.feedback.label,
      psychology: choice.feedback.psychology,
      better_alternative_hint: choice.feedback.better_alternative_hint,
    },
    metrics_updated: metricsUpdated,
    total_score: totalScore,
    is_last_interaction: isLast,
    ending,
    all_choices_revealed: allChoicesRevealed,
  };
}

/**
 * Find the matching ending for a given score.
 */
export function findEnding(scenario: Scenario, totalScore: number): Ending | null {
  const ending = scenario.endings.find(
    e => totalScore >= e.score_range.min && totalScore <= e.score_range.max
  );
  // Fallback to last ending if no match (shouldn't happen with valid scenarios)
  return ending || scenario.endings[scenario.endings.length - 1] || null;
}

/**
 * Calculate the dominant communication style from a list of choices.
 */
export function calculateDominantStyle(
  choices: ChoiceRecord[]
): CommunicationStyle | null {
  if (choices.length === 0) return null;

  const counts: Partial<Record<CommunicationStyle, number>> = {};
  for (const c of choices) {
    counts[c.communication_style] = (counts[c.communication_style] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (sorted[0]?.[0] as CommunicationStyle) || null;
}

/**
 * Calculate style distribution as percentages.
 */
export function calculateStyleDistribution(
  choices: ChoiceRecord[]
): Partial<Record<CommunicationStyle, number>> {
  if (choices.length === 0) return {};

  const counts: Partial<Record<CommunicationStyle, number>> = {};
  for (const c of choices) {
    counts[c.communication_style] = (counts[c.communication_style] || 0) + 1;
  }

  const distribution: Partial<Record<CommunicationStyle, number>> = {};
  for (const [style, count] of Object.entries(counts)) {
    distribution[style as CommunicationStyle] = Math.round((count / choices.length) * 100);
  }

  return distribution;
}

/**
 * Update player profile traits based on choices made during a session.
 * Small incremental changes — profile evolves over time.
 */
export function calculateProfileUpdates(
  choices: ChoiceRecord[]
): Partial<Record<string, number>> {
  const updates: Record<string, number> = {};

  for (const choice of choices) {
    switch (choice.communication_style) {
      case 'empathic':
        updates.empathy = (updates.empathy || 0) + 0.2;
        updates.repair_ability = (updates.repair_ability || 0) + 0.1;
        updates.shame_sensitivity = (updates.shame_sensitivity || 0) - 0.05;
        break;
      case 'aggressive':
        updates.impulsiveness = (updates.impulsiveness || 0) + 0.1;
        updates.defensiveness = (updates.defensiveness || 0) + 0.1;
        updates.need_for_control = (updates.need_for_control || 0) + 0.1;
        updates.patience = (updates.patience || 0) - 0.05;
        break;
      case 'passive_aggressive':
        updates.directness = (updates.directness || 0) - 0.1;
        updates.defensiveness = (updates.defensiveness || 0) + 0.1;
        updates.shame_sensitivity = (updates.shame_sensitivity || 0) + 0.05;
        break;
      case 'assertive':
        updates.directness = (updates.directness || 0) + 0.1;
        updates.need_for_control = (updates.need_for_control || 0) - 0.05;
        updates.patience = (updates.patience || 0) + 0.05;
        break;
      case 'passive':
        updates.directness = (updates.directness || 0) - 0.15;
        updates.patience = (updates.patience || 0) + 0.1;
        updates.shame_sensitivity = (updates.shame_sensitivity || 0) + 0.1;
        break;
      case 'transformative':
        updates.empathy = (updates.empathy || 0) + 0.15;
        updates.repair_ability = (updates.repair_ability || 0) + 0.15;
        updates.shame_sensitivity = (updates.shame_sensitivity || 0) - 0.1;
        updates.need_for_control = (updates.need_for_control || 0) - 0.05;
        break;
      case 'transactional':
        updates.directness = (updates.directness || 0) + 0.05;
        updates.need_for_control = (updates.need_for_control || 0) + 0.05;
        break;
    }
  }

  return updates;
}

/**
 * Communication style labels (Polish)
 */
export const STYLE_LABELS: Record<CommunicationStyle, string> = {
  aggressive: 'agresywny',
  passive: 'pasywny',
  passive_aggressive: 'pasywno-agresywny',
  assertive: 'asertywny',
  empathic: 'empatyczny',
  transactional: 'transakcyjny',
  transformative: 'transformacyjny',
};
