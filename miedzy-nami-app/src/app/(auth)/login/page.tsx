'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, registerWithEmail, signInWithGoogle, resetPassword } from '@/lib/firebase/auth';

/**
 * Login / Register page — Firebase Auth (email + Google).
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push('/menu');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      const msg = firebaseErr.code === 'auth/wrong-password' ? 'Nieprawidłowe hasło'
        : firebaseErr.code === 'auth/user-not-found' ? 'Nie znaleziono użytkownika'
        : firebaseErr.code === 'auth/email-already-in-use' ? 'Ten email jest już zajęty'
        : firebaseErr.code === 'auth/weak-password' ? 'Hasło musi mieć min. 6 znaków'
        : firebaseErr.code === 'auth/invalid-email' ? 'Nieprawidłowy email'
        : firebaseErr.message || 'Wystąpił błąd';
      setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/menu');
    } catch (err: unknown) {
      const firebaseErr = err as { message?: string };
      setError(firebaseErr.message || 'Logowanie przez Google nie powiodło się');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    setResetLoading(true);
    setResetError(null);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      const msg = firebaseErr.code === 'auth/user-not-found' ? 'Nie znaleziono konta z tym emailem'
        : firebaseErr.code === 'auth/invalid-email' ? 'Nieprawidłowy email'
        : firebaseErr.message || 'Wystąpił błąd';
      setResetError(msg);
    }
    setResetLoading(false);
  };

  return (
    <div className="screen fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', overflowY: 'auto' }}>
      {/* Centered form area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>💬</div>
            <h1 className="heading-display" style={{ fontSize: '1.8rem', marginBottom: 4 }}>
              Między Nami
            </h1>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
              Symulator relacji oparty o psychologię komunikacji
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 20,
              transition: 'all 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Kontynuuj z Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-dim" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>lub</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                placeholder="Hasło (min. 6 znaków)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(255, 59, 48, 0.15)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                color: '#ff6b6b',
                fontSize: '0.82rem',
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '⏳ Proszę czekać...' : mode === 'register' ? '🚀 Utwórz konto' : '🔑 Zaloguj się'}
            </button>
          </form>

          {/* Forgot password — only in login mode */}
          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              {!resetMode ? (
                <button
                  onClick={() => { setResetMode(true); setResetEmail(email); setResetSent(false); setResetError(null); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                >
                  🔑 Zapomniałeś hasła?
                </button>
              ) : resetSent ? (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(0,230,118,0.1)',
                  border: '1px solid rgba(0,230,118,0.25)',
                  marginTop: 4,
                }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--accent-green)', margin: 0, lineHeight: 1.5 }}>
                    ✅ Link do resetowania hasła został wysłany na <strong>{resetEmail}</strong>. Sprawdź skrzynkę.
                  </p>
                  <button
                    onClick={() => { setResetMode(false); setResetSent(false); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      marginTop: 8,
                    }}
                  >
                    Zamknij
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginTop: 4,
                }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                    Podaj email, a wyślemy Ci link do zresetowania hasła:
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email"
                      placeholder="Twój email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
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
                      onClick={handleResetPassword}
                      disabled={resetLoading || !resetEmail}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--accent-cyan), #0091ea)',
                        color: '#000',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: resetLoading ? 'not-allowed' : 'pointer',
                        opacity: resetLoading || !resetEmail ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {resetLoading ? '⏳' : 'Wyślij'}
                    </button>
                  </div>
                  {resetError && (
                    <p style={{ fontSize: '0.78rem', color: '#ff6b6b', marginTop: 8, marginBottom: 0 }}>
                      {resetError}
                    </p>
                  )}
                  <button
                    onClick={() => setResetMode(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      marginTop: 8,
                    }}
                  >
                    Anuluj
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Toggle mode */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setResetMode(false); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {mode === 'login' ? 'Nie masz konta? Zarejestruj się' : 'Masz konto? Zaloguj się'}
            </button>
          </div>

          {/* Skip (guest mode) */}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              onClick={() => router.push('/menu')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Kontynuuj bez logowania →
            </button>
          </div>
        </div>
      </div>

      {/* About project — bottom of screen */}
      <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '0 20px 20px' }}>
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          id="about-project-toggle"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            padding: '8px 0',
            transition: 'color 0.2s',
          }}
        >
          <span style={{ fontSize: '1rem' }}>💡</span>
          <span>O projekcie</span>
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.3s ease',
            transform: aboutOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            fontSize: '0.7rem',
          }}>▼</span>
        </button>

        <div
          style={{
            overflow: aboutOpen ? 'visible' : 'hidden',
            transition: 'max-height 0.5s ease, opacity 0.3s ease',
            maxHeight: aboutOpen ? 2000 : 0,
            opacity: aboutOpen ? 1 : 0,
          }}
        >
          <div style={{
            padding: '16px',
            marginTop: 8,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
              📖 Czym jest Między Nami?
            </h3>
            <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 14 }}>
              <strong>Między Nami</strong> to mobilna gra / symulator komunikacji, w&nbsp;której wcielasz się
              w&nbsp;jedną z&nbsp;postaci i&nbsp;podejmujesz decyzje wpływające na przebieg rozmowy oraz relację
              z&nbsp;drugą osobą. Każdy wybór ma konsekwencje — gra dynamicznie dobiera warianty scen na podstawie
              Twoich dotychczasowych odpowiedzi, a&nbsp;na końcu otrzymujesz spersonalizowaną diagnozę psychologiczną
              i&nbsp;wskazówki rozwojowe.
            </p>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Gra czerpie inspirację z&nbsp;uznanych modeli komunikacji:
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 14, paddingLeft: 4 }}>
              <div>🧠 <strong>Model von Thuna</strong> — cztery płaszczyzny komunikatu</div>
              <div>💚 <strong>Porozumienie bez Przemocy (NVC)</strong> — empatyczna komunikacja Marshalla Rosenberga</div>
              <div>🔄 <strong>Analiza Transakcyjna</strong> — dynamika relacji Rodzic–Dorosły–Dziecko</div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              📬 Kontakt
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
              Jeśli chciałbyś <strong>współpracować nad rozwojem aplikacji</strong>, skontaktuj się:
            </p>
            <a
              href="mailto:karczespatryk@gmail.com"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--accent-cyan)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
            >
              <span>✉️</span>
              <span>Napisz do mnie</span>
            </a>

            {/* Data & Privacy */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              🔒 Dane i prywatność
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
              Twoje dane (email, profil psychologiczny, wyniki&nbsp;gier) przechowywane
              są w&nbsp;<strong>Firebase (Google Cloud)</strong> na serwerach w&nbsp;UE.
              Dane służą wyłącznie do działania gry i&nbsp;nie są udostępniane
              osobom trzecim. W&nbsp;dowolnym momencie możesz usunąć swoje konto
              i&nbsp;wszystkie dane z&nbsp;poziomu menu gry.
            </p>

            {/* Disclaimer */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
            <p style={{
              fontSize: '0.68rem',
              lineHeight: 1.5,
              color: 'var(--text-dim)',
              textAlign: 'center',
              marginBottom: 12,
              fontStyle: 'italic',
            }}>
              ⚠️ Gra ma charakter wyłącznie edukacyjny i&nbsp;nie stanowi formy terapii, diagnozy
              ani porady psychologicznej. Każda realna sytuacja jest inna — w&nbsp;przypadku
              trudności emocjonalnych lub kryzysowych skontaktuj się z&nbsp;wykwalifikowanym
              specjalistą. Twórcy nie ponoszą odpowiedzialności za decyzje podejmowane
              na podstawie treści zawartych w&nbsp;grze.
            </p>

            <p style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              marginBottom: 0,
            }}>
              Zrobione z ❤️ i odrobiną psychologii
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
