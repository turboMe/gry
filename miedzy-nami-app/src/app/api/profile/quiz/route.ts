// ═══════════════════════════════════════════════════════════
//  POST /api/profile/quiz
//  Calculate psychological profile from quiz answers.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/firebase/middleware';
import { saveProfile } from '@/lib/db/profiles';
import { completeOnboarding } from '@/lib/db/users';
import { calculateProfileFromQuiz } from '@/lib/engine/profile-quiz';

export async function POST(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { answers } = body;

    if (!Array.isArray(answers) || answers.length !== 8) {
      return NextResponse.json(
        { error: 'Invalid answers', message: 'Expected array of 8 answer indices (0-3)' },
        { status: 400 }
      );
    }

    // Validate each answer is 0-3
    if (answers.some((a: number) => typeof a !== 'number' || a < 0 || a > 3)) {
      return NextResponse.json(
        { error: 'Invalid answers', message: 'Each answer must be 0-3' },
        { status: 400 }
      );
    }

    // Calculate profile from quiz answers
    const traits = calculateProfileFromQuiz(answers);

    // Save to Firestore
    const profile = await saveProfile(auth.uid, traits);

    // Mark onboarding as completed
    await completeOnboarding(auth.uid);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('POST /api/profile/quiz error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
