import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QuantMind — Internal Admin',
  description: 'QuantMind Portfolio Risk Simulation Platform Admin Panel',
};

import { AuthProvider } from '../components/auth/AuthProvider';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ToastProvider } from '../components/ui/ToastProvider';
import { ThemeProvider } from '../components/ui/ThemeProvider';
import { LoadingProvider } from '../components/ui/LoadingProvider';
import StyledJsxRegistry from './registry';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-foreground antialiased font-sans overflow-x-hidden selection:bg-cyan-500/30">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.03)_0%,transparent_50%)] pointer-events-none" />
        <StyledJsxRegistry>
          <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
            <LoadingProvider>
              <ToastProvider>
                <AuthProvider>
                  <AuthGuard>
                    {children}
                  </AuthGuard>
                </AuthProvider>
              </ToastProvider>
            </LoadingProvider>
          </ThemeProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
