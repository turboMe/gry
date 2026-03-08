// ═══════════════════════════════════════════════════════════
//  POST /api/admin/scenarios/upload — upload a scenario JSON
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse } from '@/lib/firebase/admin-middleware';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) return forbiddenResponse();

  try {
    const scenario = await request.json();

    // Basic validation
    if (!scenario.scenario_id) {
      return NextResponse.json(
        { error: 'Missing scenario_id in JSON' },
        { status: 400 }
      );
    }

    if (!scenario.metadata?.title) {
      return NextResponse.json(
        { error: 'Missing metadata.title in JSON' },
        { status: 400 }
      );
    }

    if (!scenario.interactions || !Array.isArray(scenario.interactions)) {
      return NextResponse.json(
        { error: 'Missing or invalid interactions array' },
        { status: 400 }
      );
    }

    // Save to Firestore
    await adminDb
      .collection('scenarios')
      .doc(scenario.scenario_id)
      .set(scenario);

    return NextResponse.json({
      success: true,
      scenario_id: scenario.scenario_id,
      title: scenario.metadata.title,
    });
  } catch (error) {
    console.error('POST /api/admin/scenarios/upload error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
