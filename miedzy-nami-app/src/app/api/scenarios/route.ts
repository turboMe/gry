// ═══════════════════════════════════════════════════════════
//  GET /api/scenarios
//  List scenarios with optional filters.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { listScenarios } from '@/lib/db/scenarios';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const relationship = searchParams.get('relationship') || undefined;
    const difficulty = searchParams.get('difficulty') || undefined;

    const scenarios = await listScenarios({
      relationship_type: relationship,
      difficulty,
    });

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('GET /api/scenarios error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
