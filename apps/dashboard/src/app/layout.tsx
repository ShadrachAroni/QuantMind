import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QuantMind — Internal Admin',
  description: 'QuantMind Portfolio Risk Simulation Platform Admin Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased overflow-x-hidden">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,217,255,0.05)_0%,transparent_50%)] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
