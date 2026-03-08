'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/game-store';
import { getIdToken } from '@/lib/firebase/auth';

/**
 * useDataSync — on login, pulls profile + session history from Firestore
 * and writes them into localStorage so the rest of the app can read them.
 * This ensures data survives iOS localStorage purges and works cross-device.
 */
export function useDataSync() {
  const user = useAuthStore((s) => s.user);
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      syncedRef.current = null;
      return;
    }

    // Only sync once per user session (avoid re-fetching on every render)
    if (syncedRef.current === user.uid) return;
    syncedRef.current = user.uid;

    (async () => {
      try {
        const token = await getIdToken();
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        // ── Sync profile ──
        const profileRes = await fetch('/api/profile', { headers });
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.profile && data.quiz_completed) {
            localStorage.setItem('mn_player_profile', JSON.stringify(data.profile));
          }
        }

        // ── Sync session history ──
        const sessionsRes = await fetch('/api/sessions?limit=100', { headers });
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          if (data.sessions && data.sessions.length > 0) {
            // Merge: cloud data takes priority, but keep any local-only entries
            const cloudHistory = data.sessions.map((s: Record<string, unknown>) => ({
              scenarioId: s.scenario_id,
              date: s.completed_at || s.created_at,
              score: s.total_score,
              maxScore: s.max_possible_score,
              endingColor: s.ending_color || null,
              endingId: s.ending_id || null,
            }));

            // Get existing local history
            let localHistory: { scenarioId: string; date: string }[] = [];
            try {
              localHistory = JSON.parse(localStorage.getItem('mn_session_history') || '[]');
            } catch { /* ignore */ }

            // Merge: use cloud entries + any local entries not in cloud (by date+scenarioId)
            const cloudKeys = new Set(cloudHistory.map((h: { scenarioId: string; date: string }) => `${h.scenarioId}_${h.date}`));
            const uniqueLocal = localHistory.filter(h => !cloudKeys.has(`${h.scenarioId}_${h.date}`));
            const merged = [...cloudHistory, ...uniqueLocal]
              .sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(-100);

            localStorage.setItem('mn_session_history', JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.warn('Data sync failed (non-critical):', err);
      }
    })();
  }, [user]);
}
