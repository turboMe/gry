// ═══════════════════════════════════════════════════════════
//  DATABASE LAYER — Game Sessions
//  Firestore CRUD for game session documents.
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase/admin';
import type { GameSession, ChoiceRecord, SessionStatus } from '@/lib/types/session';
import type { Metrics, EndingColor, CommunicationStyle } from '@/lib/types';

const COLLECTION = 'sessions';

/**
 * Create a new game session.
 */
export async function createSession(
  userId: string,
  scenarioId: string,
  metricsStart: Metrics,
  maxScore: number
): Promise<GameSession> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const session: GameSession = {
    session_id: sessionId,
    user_id: userId,
    scenario_id: scenarioId,
    started_at: now,
    completed_at: null,
    status: 'in_progress',
    current_interaction_index: 0,
    choices: [],
    metrics_current: { ...metricsStart },
    metrics_final: null,
    total_score: 0,
    max_possible_score: maxScore,
    ending_id: null,
    ending_color: null,
    dominant_communication_style: null,
  };

  await adminDb.collection(COLLECTION).doc(sessionId).set(session);
  return session;
}

/**
 * Get session by ID.
 */
export async function getSession(sessionId: string): Promise<GameSession | null> {
  const doc = await adminDb.collection(COLLECTION).doc(sessionId).get();
  if (!doc.exists) return null;
  return doc.data() as GameSession;
}

/**
 * Update session after a choice is made.
 */
export async function recordChoice(
  sessionId: string,
  choice: ChoiceRecord,
  metricsUpdated: Metrics,
  totalScore: number,
  nextInteractionIndex: number
): Promise<void> {
  const sessionRef = adminDb.collection(COLLECTION).doc(sessionId);
  const doc = await sessionRef.get();
  if (!doc.exists) throw new Error('Session not found');

  const session = doc.data() as GameSession;

  await sessionRef.update({
    choices: [...session.choices, choice],
    metrics_current: metricsUpdated,
    total_score: totalScore,
    current_interaction_index: nextInteractionIndex,
  });
}

/**
 * Complete a session with ending data.
 */
export async function completeSession(
  sessionId: string,
  endingId: string,
  endingColor: EndingColor,
  dominantStyle: CommunicationStyle | null,
  metricsFinal: Metrics
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(sessionId).update({
    status: 'completed' as SessionStatus,
    completed_at: new Date().toISOString(),
    ending_id: endingId,
    ending_color: endingColor,
    dominant_communication_style: dominantStyle,
    metrics_final: metricsFinal,
  });
}

/**
 * Get all sessions for a user (most recent first).
 */
export async function getUserSessions(userId: string, limit = 50): Promise<GameSession[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where('user_id', '==', userId)
    .orderBy('started_at', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => doc.data() as GameSession);
}

/**
 * Get completed sessions for a user.
 */
export async function getCompletedSessions(userId: string): Promise<GameSession[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where('user_id', '==', userId)
    .where('status', '==', 'completed')
    .orderBy('started_at', 'desc')
    .get();

  return snapshot.docs.map(doc => doc.data() as GameSession);
}
