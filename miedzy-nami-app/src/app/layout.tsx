import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/components/layout/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Między Nami — Symulator Relacji',
  description: 'Interaktywny komiks psychologiczny o komunikacji w relacjach. Rozwiń swoje umiejętności komunikacyjne przez angażujące scenariusze.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0c0c14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
