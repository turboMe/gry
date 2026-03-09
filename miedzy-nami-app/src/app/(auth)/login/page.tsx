'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, registerWithEmail, signInWithGoogle } from '@/lib/firebase/auth';

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
  const [contactOpen, setContactOpen] = useState(false);

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

  return (
    <div className="screen fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
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

          {/* Toggle mode */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
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
            overflow: 'hidden',
            transition: 'max-height 0.4s ease, opacity 0.3s ease',
            maxHeight: aboutOpen ? 500 : 0,
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
            <button
              onClick={() => setContactOpen(!contactOpen)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--accent-cyan)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <span>✉️</span>
              <span>Napisz do mnie</span>
              <span style={{
                display: 'inline-block',
                transition: 'transform 0.3s ease',
                transform: contactOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                fontSize: '0.6rem',
                marginLeft: 2,
              }}>▼</span>
            </button>
            <div
              style={{
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, opacity 0.2s ease',
                maxHeight: contactOpen ? 40 : 0,
                opacity: contactOpen ? 1 : 0,
                marginTop: contactOpen ? 8 : 0,
              }}
            >
              <a
                href="mailto:karczespatryk@gmail.com"
                style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.78rem' }}
              >
                📧 karczespatryk@gmail.com
              </a>
            </div>

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
