// ═══════════════════════════════════════════════════════════
//  POST /api/sessions/save-result
//  Saves a completed game session in a single call.
//  Used by the client-side game engine after a game ends.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/firebase/middleware';
import { adminDb } from '@/lib/firebase/admin';
import { ensureUser } from '@/lib/db/users';

export async function POST(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const {
      scenario_id,
      total_score,
      max_possible_score,
      ending_id,
      ending_color,
      dominant_style,
      metrics_final,
    } = body;

    if (!scenario_id || total_score === undefined || !ending_id) {
      return NextResponse.json(
        { error: 'Invalid body', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure user record exists
    await ensureUser(auth.uid, auth.email || '');

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    await adminDb.collection('sessions').doc(sessionId).set({
      session_id: sessionId,
      user_id: auth.uid,
      scenario_id,
      started_at: now,
      completed_at: now,
      status: 'completed',
      total_score,
      max_possible_score,
      ending_id,
      ending_color: ending_color || null,
      dominant_communication_style: dominant_style || null,
      metrics_final: metrics_final || null,
    });

    return NextResponse.json({ session_id: sessionId, saved: true });
  } catch (error) {
    console.error('POST /api/sessions/save-result error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
