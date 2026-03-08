// ═══════════════════════════════════════════════════════════
//  DATABASE LAYER — User Stats
//  Derived stats computed from sessions data.
// ═══════════════════════════════════════════════════════════

import type { UserStats, CommunicationStyle } from '@/lib/types';
import { getCompletedSessions } from './sessions';

/**
 * Calculate aggregated stats for a user from their sessions.
 */
export async function getUserStats(uid: string): Promise<UserStats> {
  const sessions = await getCompletedSessions(uid);

  const stats: UserStats = {
    user_id: uid,
    total_sessions: sessions.length,
    completed_sessions: sessions.length,
    average_score: 0,
    style_distribution: {},
    best_scenario_scores: {},
    current_streak_days: 0,
    longest_streak_days: 0,
    scenarios_completed: [],
    favorite_relationship_type: null,
  };

  if (sessions.length === 0) return stats;

  // Average score
  const totalPts = sessions.reduce((sum, s) => sum + s.total_score, 0);
  stats.average_score = Math.round((totalPts / sessions.length) * 10) / 10;

  // Style distribution
  const styleCounts: Partial<Record<CommunicationStyle, number>> = {};
  for (const s of sessions) {
    if (s.dominant_communication_style) {
      styleCounts[s.dominant_communication_style] = 
        (styleCounts[s.dominant_communication_style] || 0) + 1;
    }
  }
  for (const [style, count] of Object.entries(styleCounts)) {
    stats.style_distribution[style as CommunicationStyle] = 
      Math.round((count / sessions.length) * 100);
  }

  // Best scores per scenario
  for (const s of sessions) {
    const current = stats.best_scenario_scores[s.scenario_id] ?? -1;
    if (s.total_score > current) {
      stats.best_scenario_scores[s.scenario_id] = s.total_score;
    }
  }

  // Unique scenarios completed
  stats.scenarios_completed = [...new Set(sessions.map(s => s.scenario_id))];

  // Streak calculation (days with at least one session)
  const sessionDates = [...new Set(
    sessions.map(s => s.started_at.split('T')[0])
  )].sort().reverse();

  if (sessionDates.length > 0) {
    let streak = 1;
    let maxStreak = 1;
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user played today or yesterday
    const lastPlayDate = sessionDates[0];
    const dayDiff = Math.floor(
      (new Date(today).getTime() - new Date(lastPlayDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff <= 1) {
      for (let i = 1; i < sessionDates.length; i++) {
        const diff = Math.floor(
          (new Date(sessionDates[i - 1]).getTime() - new Date(sessionDates[i]).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 1) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          break;
        }
      }
      stats.current_streak_days = streak;
    }
    stats.longest_streak_days = maxStreak;
  }

  return stats;
}
