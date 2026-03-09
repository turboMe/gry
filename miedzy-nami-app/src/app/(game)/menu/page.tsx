'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore, useAuthStore } from '@/store/game-store';
import { getIdToken, logOut } from '@/lib/firebase/auth';

/**
 * Main Menu — the home screen of the game.
 */
export default function MenuPage() {
  const router = useRouter();
  const { quizCompleted } = useProfileStore();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<{ totalGames: number; avgScore: string } | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved profile
    const saved = localStorage.getItem('mn_player_profile');
    setHasProfile(!!saved);

    // Load basic stats from localStorage
    try {
      const history = JSON.parse(localStorage.getItem('mn_session_history') || '[]');
      if (history.length > 0) {
        const avg = (history.reduce((a: number, s: { score: number }) => a + s.score, 0) / history.length);
        setStats({ totalGames: history.length, avgScore: avg.toFixed(1) });
      }
    } catch { /* ignore */ }
  }, []);

  // Guest banner — show for non-logged-in users, auto-dismiss after 5s
  useEffect(() => {
    if (user) return;
    const dismissed = sessionStorage.getItem('mn_guest_banner_dismissed');
    if (dismissed) return;

    setShowGuestBanner(true);
    // Small delay so CSS transition can animate in
    const enterTimer = setTimeout(() => setBannerVisible(true), 50);

    const hideTimer = setTimeout(() => {
      setBannerVisible(false);
      // Wait for fade-out animation, then remove from DOM
      setTimeout(() => {
        setShowGuestBanner(false);
        sessionStorage.setItem('mn_guest_banner_dismissed', '1');
      }, 400);
    }, 5000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(hideTimer);
    };
  }, [user]);

  // Check admin status silently
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setIsAdmin(true);
      } catch { /* not admin, that's fine */ }
    })();
  }, [user]);

  const handlePlay = () => {
    if (!quizCompleted && !hasProfile) {
      router.push('/quiz');
      return;
    }
    router.push('/scenarios');
  };

  const handleProfile = () => {
    if (hasProfile) {
      router.push('/profile');
    } else {
      router.push('/quiz');
    }
  };

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logOut();
    router.replace('/login');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'USUŃ') return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Brak tokenu');

      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Nie udało się usunąć konta');
      }

      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login
      window.location.href = '/login';
    } catch (err: unknown) {
      const error = err as { message?: string };
      setDeleteError(error.message || 'Wystąpił błąd');
      setDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirm('');
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  return (
    <div className="screen fade-in" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px 24px' }}>
      <div className="menu-bg" />

      {/* Hamburger button — only for logged-in users */}
      {user && (
        <button
          className="hamburger-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="Menu ustawień"
          id="hamburger-menu-btn"
        >
          ☰
        </button>
      )}

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {/* Guest banner */}
        {showGuestBanner && (
          <div
            style={{
              marginBottom: 20,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(0,194,255,0.12), rgba(139,92,246,0.12))',
              border: '1px solid rgba(0,194,255,0.2)',
              opacity: bannerVisible ? 1 : 0,
              transform: bannerVisible ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💾</span>
            <p style={{
              margin: 0,
              fontSize: '0.76rem',
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
              textAlign: 'left',
            }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>Załóż konto</strong>, aby zapisywać wyniki
              i&nbsp;śledzić swoje postępy między sesjami.
            </p>
          </div>
        )}

        <div className="game-logo">Między Nami</div>
        <div className="game-subtitle">Symulator Relacji</div>
        <div className="menu-divider" />

        {stats && (
          <div className="text-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', marginBottom: 28, opacity: 0.9 }}>
            Sesji: {stats.totalGames} · Średni wynik: {stats.avgScore}
          </div>
        )}

        <div className="flex-col gap-md" style={{ marginBottom: 24 }}>
          <button className="btn btn-primary" onClick={handlePlay}>
            <span className="btn-icon">🎮</span>
            <span className="btn-label">Graj</span>
            <span className="btn-arrow">→</span>
          </button>

          <button className="btn" onClick={handleProfile}>
            <span className="btn-icon">👤</span>
            <span className="btn-label">{hasProfile ? 'Twój profil' : 'Stwórz profil'}</span>
            <span className="btn-arrow">→</span>
          </button>

          <button className="btn" onClick={() => router.push('/stats')}>
            <span className="btn-icon">📊</span>
            <span className="btn-label">Statystyki</span>
            <span className="btn-arrow">→</span>
          </button>

          {isAdmin && (
            <button className="btn" onClick={() => router.push('/admin')} style={{ borderColor: 'rgba(255,215,0,0.3)' }}>
              <span className="btn-icon">⚙️</span>
              <span className="btn-label">Panel Admina</span>
              <span className="btn-arrow">→</span>
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Interaktywny komiks o psychologii komunikacji
        </div>
      </div>

      {/* ═══ Side Drawer ═══ */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="side-drawer" id="settings-drawer">
            <div className="drawer-header">
              <span className="drawer-title">⚙️ Ustawienia</span>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Zamknij">✕</button>
            </div>

            <div className="drawer-body">
              {/* Privacy / Data Info */}
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <span>🔒</span>
                  <span>Twoje dane</span>
                </div>
                <p className="drawer-section-text">
                  Przechowujemy Twoje dane w&nbsp;<strong>Firebase (Google Cloud)</strong>,
                  serwery zlokalizowane w&nbsp;UE. Dane służą wyłącznie do działania gry
                  i&nbsp;nie są udostępniane osobom trzecim.
                </p>
                <div className="drawer-data-list">
                  <div className="drawer-data-item">
                    <span className="drawer-data-icon">📧</span>
                    <span><strong>Email</strong> — do logowania i identyfikacji konta</span>
                  </div>
                  <div className="drawer-data-item">
                    <span className="drawer-data-icon">🧠</span>
                    <span><strong>Profil psychologiczny</strong> — cechy komunikacji z quizu</span>
                  </div>
                  <div className="drawer-data-item">
                    <span className="drawer-data-icon">🎮</span>
                    <span><strong>Historia gier</strong> — wybory, wyniki i zakończenia</span>
                  </div>
                </div>
                <p className="drawer-section-text" style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Możesz usunąć wszystkie swoje dane w&nbsp;dowolnym momencie, korzystając z&nbsp;przycisku poniżej.
                </p>
              </div>

              <div className="drawer-divider" />

              {/* Actions */}
              <button className="drawer-action-btn" onClick={handleLogout}>
                <span className="drawer-action-icon">🚪</span>
                <span>Wyloguj się</span>
              </button>

              <button
                className="drawer-action-btn drawer-action-btn-danger"
                onClick={openDeleteModal}
                id="delete-account-btn"
              >
                <span className="drawer-action-icon">🗑️</span>
                <span>Usuń konto i dane</span>
              </button>

              {/* Contact */}
              <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
                  Pytania dotyczące danych?<br />
                  <a
                    href="mailto:karczespatryk@gmail.com"
                    style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}
                  >
                    karczespatryk@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ Delete Account Modal ═══ */}
      {showDeleteModal && (
        <div className="delete-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">⚠️</div>
            <div className="delete-modal-title">Usunięcie konta</div>
            <div className="delete-modal-desc">
              Ta operacja jest <strong style={{ color: 'var(--accent-red)' }}>nieodwracalna</strong>.
              Zostaną usunięte:
              <br /><br />
              • Twoje konto i email<br />
              • Profil psychologiczny<br />
              • Cała historia gier i wyniki
              <br /><br />
              Wpisz <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>USUŃ</strong> aby potwierdzić:
            </div>

            <input
              type="text"
              className="delete-modal-confirm-input"
              placeholder="Wpisz USUŃ"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
              disabled={deleting}
              autoComplete="off"
              id="delete-confirm-input"
            />

            {deleteError && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(255, 59, 48, 0.12)',
                border: '1px solid rgba(255, 59, 48, 0.25)',
                color: '#ff6b6b',
                fontSize: '0.78rem',
                marginBottom: 12,
              }}>
                {deleteError}
              </div>
            )}

            <div className="delete-modal-actions">
              <button
                className="delete-modal-btn delete-modal-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Anuluj
              </button>
              <button
                className="delete-modal-btn delete-modal-btn-delete"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'USUŃ' || deleting}
                id="delete-confirm-btn"
              >
                {deleting ? '⏳ Usuwanie...' : '🗑️ Usuń konto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
