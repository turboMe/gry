// ═══════════════════════════════════════════════════════════
//  GET /api/admin/scenarios — list all scenarios
//  DELETE /api/admin/scenarios?id=xxx — delete a scenario
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse } from '@/lib/firebase/admin-middleware';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) return forbiddenResponse();

  try {
    const scenariosSnap = await adminDb.collection('scenarios').get();
    const scenarios = scenariosSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.metadata?.title || 'Bez tytułu',
        difficulty: data.tags?.difficulty || '—',
        relationship_type: data.tags?.relationship_type || '—',
        interactions_count: data.interactions?.length || 0,
        age_rating: data.tags?.age_rating || '—',
      };
    });

    // Get session counts per scenario
    const sessionsSnap = await adminDb.collection('sessions').get();
    const sessionCounts: Record<string, number> = {};
    sessionsSnap.docs.forEach((doc) => {
      const sid = doc.data().scenario_id;
      if (sid) sessionCounts[sid] = (sessionCounts[sid] || 0) + 1;
    });

    const enriched = scenarios.map((s) => ({
      ...s,
      session_count: sessionCounts[s.id] || 0,
    }));

    return NextResponse.json({ scenarios: enriched });
  } catch (error) {
    console.error('GET /api/admin/scenarios error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) return forbiddenResponse();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing scenario id' }, { status: 400 });
  }

  try {
    await adminDb.collection('scenarios').doc(id).delete();
    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('DELETE /api/admin/scenarios error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
