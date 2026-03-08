// ═══════════════════════════════════════════════════════════
//  GET /api/stats
//  Get aggregated user statistics.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/firebase/middleware';
import { getUserStats } from '@/lib/db/stats';

export async function GET(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const stats = await getUserStats(auth.uid);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
