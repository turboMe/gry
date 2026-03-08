// ═══════════════════════════════════════════════════════════
//  METRICS ENGINE
//  Handles metric calculation: apply effects, clamp, scale.
//  Pure functions — no side effects, no dependencies on React.
// ═══════════════════════════════════════════════════════════

import type { Metrics, MetricEffects } from '@/lib/types';

/** Default scale factor: metric_effect * SCALE = actual % change */
const METRIC_SCALE = 5;

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Apply metric effects to current metrics.
 * Each effect value (-3 to +3) is multiplied by SCALE_FACTOR (default 5).
 * Result is clamped to 0-100.
 */
export function applyMetricEffects(
  current: Metrics,
  effects: MetricEffects,
  scaleFactor: number = METRIC_SCALE
): Metrics {
  return {
    tension: clamp(current.tension + effects.tension * scaleFactor, 0, 100),
    trust: clamp(current.trust + effects.trust * scaleFactor, 0, 100),
    openness: clamp(current.openness + effects.openness * scaleFactor, 0, 100),
    feeling_heard: clamp(current.feeling_heard + effects.feeling_heard * scaleFactor, 0, 100),
  };
}

/**
 * Calculate overall relationship health from metrics.
 * Higher trust/openness/feeling_heard and lower tension = better.
 */
export function calculateRelationshipHealth(metrics: Metrics): number {
  const invertedTension = 100 - metrics.tension;
  return Math.round(
    (invertedTension + metrics.trust + metrics.openness + metrics.feeling_heard) / 4
  );
}

/**
 * Get metric display info for UI
 */
export const METRIC_DISPLAY = {
  tension: { icon: '🔥', label: 'Napięcie', color: 'var(--tension-color)', invertedBetter: true },
  trust: { icon: '🤝', label: 'Zaufanie', color: 'var(--trust-color)', invertedBetter: false },
  openness: { icon: '💬', label: 'Dialog', color: 'var(--openness-color)', invertedBetter: false },
  feeling_heard: { icon: '👂', label: 'Słuchanie', color: 'var(--heard-color)', invertedBetter: false },
} as const;
