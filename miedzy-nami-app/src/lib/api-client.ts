// ═══════════════════════════════════════════════════════════
//  API CLIENT — Authenticated fetch helper
//  Used by frontend to call API routes with Firebase ID token.
// ═══════════════════════════════════════════════════════════

import { getAuth } from 'firebase/auth';

/**
 * Make an authenticated API request.
 * Automatically adds Firebase ID token as Bearer auth.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = getAuth();
  const user = auth.currentUser;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, errorData.error || 'Request failed', errorData.message);
  }

  return response.json();
}

/**
 * Structured API error.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    public details?: string
  ) {
    super(`API Error ${status}: ${error}${details ? ` — ${details}` : ''}`);
    this.name = 'ApiError';
  }
}

// ── Convenience methods ──

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
