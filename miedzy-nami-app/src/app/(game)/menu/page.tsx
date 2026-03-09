'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore, useAuthStore } from '@/store/game-store';
import { POSITIVE_TRAITS, NEGATIVE_TRAITS } from '@/lib/engine/profile-quiz';
import { getIdToken, logOut, changeEmail } from '@/lib/firebase/auth';

/**
 * Main Menu — the home screen of the game.
 */
export default function MenuPage() {
  const router = useRouter();
  const { quizCompleted } = useProfileStore();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<{ totalGames: number } | null>(null);
  const [profileAvgs, setProfileAvgs] = useState<{ resourcesAvg: string; barriersAvg: string } | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showGuestBanner, setShowGuestBanner] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  // Welcome disclaimer state
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mn_disclaimer_accepted') === '1';
    }
    return false;
  });

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Email change state
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailChangeResult, setEmailChangeResult] = useState<'success' | 'error' | null>(null);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved profile
    const saved = localStorage.getItem('mn_player_profile');
    setHasProfile(!!saved);

    // Load basic stats from localStorage
    try {
      const history = JSON.parse(localStorage.getItem('mn_session_history') || '[]');
      if (history.length > 0) {
        setStats({ totalGames: history.length });
      }
    } catch { /* ignore */ }

    // Load profile averages
    try {
      const profileRaw = localStorage.getItem('mn_player_profile');
      if (profileRaw) {
        const p = JSON.parse(profileRaw);
        const resAvg = POSITIVE_TRAITS.reduce((a, t) => a + (typeof p[t] === 'number' ? p[t] : 5), 0) / POSITIVE_TRAITS.length;
        const barAvg = NEGATIVE_TRAITS.reduce((a, t) => a + (typeof p[t] === 'number' ? p[t] : 5), 0) / NEGATIVE_TRAITS.length;
        setProfileAvgs({ resourcesAvg: resAvg.toFixed(1), barriersAvg: barAvg.toFixed(1) });
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

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('mn_disclaimer_accepted', '1');
    setDisclaimerAccepted(true);
  };

  // ═══ WELCOME SCREEN (first launch) ═══
  if (!disclaimerAccepted) {
    return <WelcomeScreen onAccept={handleAcceptDisclaimer} />;
  }

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

  const handleEmailChange = async () => {
    if (!newEmail) return;
    setEmailChanging(true);
    setEmailChangeResult(null);
    setEmailChangeError(null);
    try {
      await changeEmail(newEmail);
      setEmailChangeResult('success');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      let msg: string;
      switch (firebaseErr.code) {
        case 'auth/invalid-email':
          msg = 'Podany adres email jest nieprawidłowy';
          break;
        case 'auth/email-already-in-use':
          msg = 'Ten adres email jest już zajęty';
          break;
        case 'auth/requires-recent-login':
          msg = 'Sesja wygasła — wyloguj się, zaloguj ponownie i spróbuj jeszcze raz';
          break;
        case 'auth/network-request-failed':
          msg = 'Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie';
          break;
        default:
          msg = 'Nie udało się zmienić emaila. Spróbuj ponownie';
      }
      setEmailChangeError(msg);
      setEmailChangeResult('error');
    }
    setEmailChanging(false);
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

        {(stats || profileAvgs) && (
          <div style={{ marginBottom: 28, opacity: 0.9, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {stats && (
              <div className="text-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-gold)' }}>
                Sesji: {stats.totalGames}
              </div>
            )}
            {profileAvgs && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
                <span className="text-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
                  🛡️ {profileAvgs.resourcesAvg}
                </span>
                <span className="text-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-orange, #ff9100)' }}>
                  💪 {profileAvgs.barriersAvg}
                </span>
              </div>
            )}
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

              {/* Email Change */}
              {!emailChangeOpen ? (
                <button className="drawer-action-btn" onClick={() => { setEmailChangeOpen(true); setNewEmail(''); setEmailChangeResult(null); setEmailChangeError(null); }}>
                  <span className="drawer-action-icon">✏️</span>
                  <span>Zmień email</span>
                </button>
              ) : emailChangeResult === 'success' ? (
                <div className="drawer-section" style={{ borderColor: 'rgba(0,230,118,0.25)', background: 'rgba(0,230,118,0.06)' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--accent-green)', margin: 0, lineHeight: 1.5 }}>
                    ✅ Link weryfikacyjny został wysłany na <strong>{newEmail}</strong>. Po kliknięciu w link Twój email zostanie zmieniony.
                  </p>
                  <button
                    onClick={() => { setEmailChangeOpen(false); setEmailChangeResult(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      marginTop: 8,
                      padding: 0,
                    }}
                  >
                    Zamknij
                  </button>
                </div>
              ) : (
                <div className="drawer-section">
                  <div className="drawer-section-title">
                    <span>✏️</span>
                    <span>Zmień email</span>
                  </div>
                  <p className="drawer-section-text" style={{ marginBottom: 10 }}>
                    Podaj nowy adres email. Wyślemy na niego link weryfikacyjny.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email"
                      placeholder="Nowy email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={emailChanging}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleEmailChange}
                      disabled={emailChanging || !newEmail}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--accent-cyan), #0091ea)',
                        color: '#000',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: emailChanging ? 'not-allowed' : 'pointer',
                        opacity: emailChanging || !newEmail ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {emailChanging ? '⏳' : 'Wyślij'}
                    </button>
                  </div>
                  {emailChangeError && (
                    <p style={{ fontSize: '0.78rem', color: '#ff6b6b', marginTop: 8, marginBottom: 0 }}>
                      {emailChangeError}
                    </p>
                  )}
                  <button
                    onClick={() => setEmailChangeOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      marginTop: 8,
                      padding: 0,
                    }}
                  >
                    Anuluj
                  </button>
                </div>
              )}

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
              <a
                href="mailto:karczespatryk@gmail.com"
                className="drawer-action-btn"
                style={{ textDecoration: 'none', marginTop: 'auto' }}
              >
                <span className="drawer-action-icon">✉️</span>
                <span>Kontakt z twórcą</span>
              </a>
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

// ═══════════════════════════════════════════════════════════
//  WELCOME SCREEN — shown on first launch (disclaimer)
// ═══════════════════════════════════════════════════════════

function WelcomeScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="screen fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="menu-bg" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px 120px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>💬</div>
            <div className="game-logo" style={{ fontSize: '2rem' }}>Między Nami</div>
            <div className="game-subtitle">Symulator Relacji</div>
          </div>

          {/* Card 1: About the game */}
          <div className="card" style={{ padding: 20, marginBottom: 16, borderColor: 'rgba(0,229,255,0.2)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
              📖 Czym jest ta gra?
            </h3>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: 14 }}>
              <strong>Między Nami</strong> to interaktywna gra edukacyjna o&nbsp;psychologii komunikacji.
              Wcielasz się w&nbsp;postać i&nbsp;podejmujesz decyzje wpływające na przebieg rozmowy
              z&nbsp;drugą osobą. Każdy wybór ma konsekwencje — gra dynamicznie dobiera warianty scen,
              a&nbsp;na końcu otrzymujesz spersonalizowaną analizę i&nbsp;wskazówki rozwojowe.
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div>🧠 <strong>Model von Thuna</strong> — cztery płaszczyzny komunikatu</div>
              <div>💚 <strong>Porozumienie bez Przemocy (NVC)</strong> — empatyczna komunikacja</div>
              <div>🔄 <strong>Analiza Transakcyjna</strong> — dynamika relacji</div>
            </div>
          </div>

          {/* Card 2: Disclaimer */}
          <div className="card" style={{
            padding: 20,
            marginBottom: 16,
            borderColor: 'rgba(255,152,0,0.3)',
            background: 'linear-gradient(135deg, rgba(255,152,0,0.06), rgba(244,67,54,0.04))',
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--accent-orange, #ff9100)' }}>
              ⚠️ Ważna informacja
            </h3>
            <div style={{ fontSize: '0.82rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 14 }}>
              <div>• To <strong>nie jest</strong> narzędzie diagnostyczne ani forma terapii</div>
              <div>• Wyniki i&nbsp;profil psychologiczny służą <strong>wyłącznie celom edukacyjnym</strong></div>
              <div>• Gra <strong>nie zastępuje</strong> konsultacji z&nbsp;wykwalifikowanym specjalistą</div>
              <div>• Twórcy nie ponoszą odpowiedzialności za decyzje podejmowane na podstawie treści gry</div>
            </div>
            <div style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                W sytuacji kryzysu emocjonalnego:
              </div>
              <div style={{ fontSize: '0.82rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                <div>📞 Telefon Zaufania: <strong style={{ color: 'var(--accent-cyan)' }}>116 123</strong></div>
                <div>📞 Centrum Wsparcia: <strong style={{ color: 'var(--accent-cyan)' }}>800 70 2222</strong></div>
              </div>
            </div>
          </div>

          {/* Card 3: Privacy */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
              🔒 Twoje dane
            </h3>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--text-secondary)', marginBottom: 0 }}>
              Dane (email, profil, wyniki) przechowywane są w&nbsp;<strong>Firebase (Google Cloud)</strong>{' '}
              na serwerach w&nbsp;UE. Służą wyłącznie do działania gry i&nbsp;nie są udostępniane
              osobom trzecim. Możesz je usunąć w&nbsp;dowolnym momencie z&nbsp;poziomu ustawień w&nbsp;menu.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky button */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <button
          className="btn btn-primary"
          onClick={onAccept}
          style={{ maxWidth: 420, width: '100%', padding: '16px 24px', fontSize: '1rem', fontWeight: 700 }}
        >
          Rozumiem i kontynuuję →
        </button>
      </div>
    </div>
  );
}
