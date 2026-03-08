// ═══════════════════════════════════════════════════════════
//  AUTH MIDDLEWARE
//  Verifies Firebase ID token from Authorization header.
//  Used by all protected API routes.
// ═══════════════════════════════════════════════════════════

import { adminAuth } from './admin';

export interface AuthUser {
  uid: string;
  email: string | undefined;
}

/**
 * Verify the Firebase ID token from the request.
 * Returns the decoded user or null if unauthorized.
 */
export async function verifyAuth(request: Request): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);

    return {
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

/**
 * Helper: returns 401 response if not authenticated.
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: 'Unauthorized', message: 'Valid Firebase ID token required' },
    { status: 401 }
  );
}
