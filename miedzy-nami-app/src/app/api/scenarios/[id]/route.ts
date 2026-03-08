// ═══════════════════════════════════════════════════════════
//  GET /api/scenarios/[id]
//  Get a single scenario by ID.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { getScenario } from '@/lib/db/scenarios';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenario = await getScenario(id);

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error('GET /api/scenarios/[id] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
