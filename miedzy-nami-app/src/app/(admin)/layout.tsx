'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/game-store';
import { getIdToken } from '@/lib/firebase/auth';

/**
 * Admin Layout — sidebar navigation + admin gate.
 * Redirects non-admin users to /menu.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    // Verify admin by calling admin API
    (async () => {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAdmin(res.ok);
        if (!res.ok) router.replace('/menu');
      } catch {
        setIsAdmin(false);
        router.replace('/menu');
      }
    })();
  }, [user, loading, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="screen fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" />
        <div style={{ marginTop: 16, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          Sprawdzanie uprawnień...
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/scenarios', label: 'Scenariusze', icon: '📦' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span style={{ fontSize: '1.3rem' }}>⚙️</span>
          <span className="heading-section" style={{ fontSize: '1rem' }}>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.href}
              className={`admin-nav-item ${pathname === item.href ? 'admin-nav-active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button
            className="admin-nav-item"
            onClick={() => router.push('/menu')}
          >
            <span>🎮</span>
            <span>Wróć do gry</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
