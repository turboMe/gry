// ═══════════════════════════════════════════════════════════
//  DELETE /api/account
//  Permanently deletes user account and all associated data.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/firebase/middleware';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function DELETE(request: Request) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  const uid = auth.uid;

  try {
    // 1. Delete all sessions for this user (batch delete, max 500 per batch)
    const sessionsQuery = adminDb.collection('sessions').where('user_id', '==', uid);
    const sessionsSnapshot = await sessionsQuery.get();

    if (!sessionsSnapshot.empty) {
      const batches: FirebaseFirestore.WriteBatch[] = [];
      let currentBatch = adminDb.batch();
      let opCount = 0;

      for (const doc of sessionsSnapshot.docs) {
        currentBatch.delete(doc.ref);
        opCount++;
        if (opCount >= 450) {
          batches.push(currentBatch);
          currentBatch = adminDb.batch();
          opCount = 0;
        }
      }
      if (opCount > 0) batches.push(currentBatch);

      await Promise.all(batches.map(b => b.commit()));
    }

    // 2. Delete profile document
    const profileRef = adminDb.collection('profiles').doc(uid);
    const profileDoc = await profileRef.get();
    if (profileDoc.exists) await profileRef.delete();

    // 3. Delete user document
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) await userRef.delete();

    // 4. Delete Firebase Auth account
    await adminAuth.deleteUser(uid);

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('DELETE /api/account error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
