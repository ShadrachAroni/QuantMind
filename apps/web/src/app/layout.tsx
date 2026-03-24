import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QuantMind — Institutional Portfolio Terminal',
  description: 'AI-powered portfolio risk simulation and analysis platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@300;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-foreground antialiased overflow-x-hidden">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,217,255,0.05)_0%,transparent_50%)] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
