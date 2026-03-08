// ═══════════════════════════════════════════════════════════
//  ADMIN MIDDLEWARE
//  Verifies Firebase ID token + checks admin email list.
// ═══════════════════════════════════════════════════════════

import { adminAuth } from './admin';

export interface AdminUser {
  uid: string;
  email: string;
}

/**
 * Get admin emails from env (comma-separated).
 */
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Verify the request comes from an admin user.
 * Returns the admin user or null if not authorized.
 */
export async function verifyAdmin(request: Request): Promise<AdminUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email?.toLowerCase();

    if (!email) return null;

    const adminEmails = getAdminEmails();
    if (adminEmails.length === 0) {
      console.warn('⚠️ ADMIN_EMAILS not set — no admin access available');
      return null;
    }

    if (!adminEmails.includes(email)) return null;

    return { uid: decoded.uid, email };
  } catch (error) {
    console.error('Admin verification failed:', error);
    return null;
  }
}

/**
 * Helper: returns 403 response for non-admin users.
 */
export function forbiddenResponse() {
  return Response.json(
    { error: 'Forbidden', message: 'Admin access required' },
    { status: 403 }
  );
}
