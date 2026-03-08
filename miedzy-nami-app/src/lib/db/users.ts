// ═══════════════════════════════════════════════════════════
//  DATABASE LAYER — Users
//  Firestore CRUD for user documents.
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase/admin';
import type { User } from '@/lib/types';

const COLLECTION = 'users';

/**
 * Create a new user document (called after first auth).
 */
export async function createUser(uid: string, data: { email: string; displayName?: string }) {
  const now = new Date().toISOString();
  const user: User = {
    user_id: uid,
    email: data.email,
    display_name: data.displayName || data.email.split('@')[0],
    language_preference: 'pl',
    created_at: now,
    last_active_at: now,
    subscription_tier: 'free',
    onboarding_completed: false,
  };

  await adminDb.collection(COLLECTION).doc(uid).set(user);
  return user;
}

/**
 * Get user by UID.
 */
export async function getUser(uid: string): Promise<User | null> {
  const doc = await adminDb.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as User;
}

/**
 * Update last active timestamp.
 */
export async function updateLastActive(uid: string) {
  await adminDb.collection(COLLECTION).doc(uid).update({
    last_active_at: new Date().toISOString(),
  });
}

/**
 * Ensure user exists — creates if not found (upsert pattern).
 */
export async function ensureUser(uid: string, email: string): Promise<User> {
  const existing = await getUser(uid);
  if (existing) {
    // Update last active silently
    updateLastActive(uid).catch(() => {});
    return existing;
  }
  return createUser(uid, { email });
}

/**
 * Mark onboarding as completed.
 */
export async function completeOnboarding(uid: string) {
  await adminDb.collection(COLLECTION).doc(uid).update({
    onboarding_completed: true,
  });
}
