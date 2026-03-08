// ═══════════════════════════════════════════════════════════
//  GET /api/admin/stats — aggregated platform statistics
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, forbiddenResponse } from '@/lib/firebase/admin-middleware';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) return forbiddenResponse();

  try {
    // Count collections in parallel
    const [usersSnap, sessionsSnap, scenariosSnap] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('sessions').get(),
      adminDb.collection('scenarios').count().get(),
    ]);

    const totalUsers = usersSnap.data().count;
    const totalScenarios = scenariosSnap.data().count;
    const totalSessions = sessionsSnap.size;

    // Calculate average score
    let totalScore = 0;
    let scoredSessions = 0;
    sessionsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.total_score !== undefined && data.status === 'completed') {
        totalScore += data.total_score;
        scoredSessions++;
      }
    });

    const avgScore = scoredSessions > 0 ? totalScore / scoredSessions : 0;

    // Recent sessions (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSessions = sessionsSnap.docs.filter((doc) => {
      const created = doc.data().created_at;
      if (!created) return false;
      const date = created.toDate ? created.toDate() : new Date(created);
      return date >= weekAgo;
    }).length;

    return NextResponse.json({
      stats: {
        totalUsers,
        totalSessions,
        totalScenarios,
        avgScore: Math.round(avgScore * 10) / 10,
        recentSessions,
        scoredSessions,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
