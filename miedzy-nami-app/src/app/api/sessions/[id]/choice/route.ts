// ═══════════════════════════════════════════════════════════
//  POST /api/sessions/[id]/choice
//  Process a player's choice in a game session.
//  This is the core gameplay API endpoint.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/firebase/middleware';
import { getSession, recordChoice, completeSession } from '@/lib/db/sessions';
import { getScenario } from '@/lib/db/scenarios';
import { processChoice, calculateDominantStyle } from '@/lib/engine/game-engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { choice_id } = body;

    // Validate choice_id
    if (!['A', 'B', 'C', 'D'].includes(choice_id)) {
      return NextResponse.json(
        { error: 'Invalid choice_id', message: 'Must be A, B, C, or D' },
        { status: 400 }
      );
    }

    // Load session
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify ownership
    if (session.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check session is still in progress
    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Load scenario
    const scenario = await getScenario(session.scenario_id);
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 500 });
    }

    // Process the choice through game engine
    const result = processChoice(
      scenario,
      session,
      session.current_interaction_index,
      choice_id as 'A' | 'B' | 'C' | 'D'
    );

    // Save choice to session
    await recordChoice(
      sessionId,
      result.choice_record,
      result.metrics_updated,
      result.total_score,
      session.current_interaction_index + 1
    );

    // If this was the last interaction, complete the session
    if (result.is_last_interaction && result.ending) {
      const allChoices = [...session.choices, result.choice_record];
      const dominantStyle = calculateDominantStyle(allChoices);

      await completeSession(
        sessionId,
        result.ending.ending_id,
        result.ending.color,
        dominantStyle,
        result.metrics_updated
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/sessions/[id]/choice error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
