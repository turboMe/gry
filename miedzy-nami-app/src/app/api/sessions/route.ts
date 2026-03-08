// ═══════════════════════════════════════════════════════════
//  POST /api/sessions — Create new game session
//  GET /api/sessions — List user's sessions
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/firebase/middleware';
import { createSession, getUserSessions } from '@/lib/db/sessions';
import { getScenario } from '@/lib/db/scenarios';
import { ensureUser } from '@/lib/db/users';

export async function POST(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { scenario_id } = body;

    if (!scenario_id || typeof scenario_id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid body', message: 'Expected { scenario_id: string }' },
        { status: 400 }
      );
    }

    // Load the scenario to get initial metrics and max score
    const scenario = await getScenario(scenario_id);
    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found', message: `No scenario with id: ${scenario_id}` },
        { status: 404 }
      );
    }

    // Ensure user record exists
    await ensureUser(auth.uid, auth.email || '');

    // Create session
    const session = await createSession(
      auth.uid,
      scenario_id,
      scenario.metrics_start,
      scenario.interactions.length * 2
    );

    return NextResponse.json({
      session,
      scenario,
    });
  } catch (error) {
    console.error('POST /api/sessions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const sessions = await getUserSessions(auth.uid, limit);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('GET /api/sessions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
