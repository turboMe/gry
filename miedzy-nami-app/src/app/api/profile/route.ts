// ═══════════════════════════════════════════════════════════
//  GET/PUT /api/profile
//  Fetch or update player psychological profile.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/firebase/middleware';
import { getProfile, saveProfile } from '@/lib/db/profiles';
import { ensureUser } from '@/lib/db/users';

export async function GET(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    // Ensure user record exists
    await ensureUser(auth.uid, auth.email || '');

    const profile = await getProfile(auth.uid);
    if (!profile) {
      return NextResponse.json({ profile: null, quiz_completed: false });
    }

    return NextResponse.json({ profile, quiz_completed: true });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { traits } = body;

    if (!traits || typeof traits !== 'object') {
      return NextResponse.json(
        { error: 'Invalid body', message: 'Expected { traits: PsychologicalProfile }' },
        { status: 400 }
      );
    }

    const profile = await saveProfile(auth.uid, traits);
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
