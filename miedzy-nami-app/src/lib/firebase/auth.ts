// ═══════════════════════════════════════════════════════════
//  FIREBASE AUTH HELPERS
//  Client-side auth operations. All functions are no-ops if
//  Firebase is not configured (MVP mode).
// ═══════════════════════════════════════════════════════════

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './client';

/**
 * Register with email and password.
 */
export async function registerWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Sign in with Google.
 */
export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Send password reset email.
 */
export async function resetPassword(email: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  await sendPasswordResetEmail(auth, email);
}

/**
 * Change user email — sends verification to the new address first.
 * After the user clicks the link, Firebase updates the email automatically.
 */
export async function changeEmail(newEmail: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase not configured');
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  await verifyBeforeUpdateEmail(user, newEmail);
}

/**
 * Sign out.
 */
export async function logOut() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

/**
 * Get the current user's ID token for API calls.
 */
export async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Subscribe to auth state changes.
 * Returns a dummy unsubscribe if Firebase is not configured.
 */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured()) {
    // In MVP mode: immediately call with null and return noop
    callback(null);
    return () => {};
  }
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
