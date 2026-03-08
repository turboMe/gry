// ═══════════════════════════════════════════════════════════
//  DATABASE LAYER — Player Profiles
//  Firestore CRUD for psychological profile documents.
// ═══════════════════════════════════════════════════════════

import { adminDb } from '@/lib/firebase/admin';
import type { PlayerProfile, PsychologicalProfile } from '@/lib/types';
import { DEFAULT_PROFILE } from '@/lib/types/user';

const COLLECTION = 'profiles';

/**
 * Get player profile by UID.
 */
export async function getProfile(uid: string): Promise<PlayerProfile | null> {
  const doc = await adminDb.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as PlayerProfile;
}

/**
 * Save a new player profile (after quiz completion).
 */
export async function saveProfile(uid: string, traits: PsychologicalProfile): Promise<PlayerProfile> {
  const now = new Date().toISOString();
  const profile: PlayerProfile = {
    user_id: uid,
    traits,
    profile_version: 1,
    quiz_completed_at: now,
    last_updated_at: now,
  };

  await adminDb.collection(COLLECTION).doc(uid).set(profile);
  return profile;
}

/**
 * Update profile traits incrementally (after game session).
 * Merges deltas into existing traits with clamping [0, 10].
 */
export async function updateProfileTraits(
  uid: string,
  deltas: Partial<Record<string, number>>
): Promise<PlayerProfile | null> {
  const profile = await getProfile(uid);
  if (!profile) return null;

  const updatedTraits = { ...profile.traits };

  for (const [key, delta] of Object.entries(deltas)) {
    if (key in updatedTraits && typeof delta === 'number') {
      const current = updatedTraits[key as keyof PsychologicalProfile];
      updatedTraits[key as keyof PsychologicalProfile] = Math.max(0, Math.min(10, current + delta));
    }
  }

  const now = new Date().toISOString();
  await adminDb.collection(COLLECTION).doc(uid).update({
    traits: updatedTraits,
    profile_version: profile.profile_version + 1,
    last_updated_at: now,
  });

  return { ...profile, traits: updatedTraits, profile_version: profile.profile_version + 1, last_updated_at: now };
}

/**
 * Get or create default profile.
 */
export async function ensureProfile(uid: string): Promise<PlayerProfile> {
  const existing = await getProfile(uid);
  if (existing) return existing;
  return saveProfile(uid, DEFAULT_PROFILE);
}
