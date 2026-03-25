import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, DM_Sans, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cormorant" });

export const viewport: Viewport = {
  themeColor: '#080810',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "QuantMind | Institutional Portfolio Intelligence",
  description: "Advanced portfolio risk modeling powered by Monte Carlo simulation. Experience the future of investment foresight today.",
  keywords: ["QuantMind", "Portfolio Risk", "Monte Carlo Simulation", "Financial Intelligence", "Risk Modeling", "VaR", "CVaR"],
  authors: [{ name: "QuantMind Engineering" }],
  openGraph: {
    title: "QuantMind | Institutional Portfolio Intelligence",
    description: "Advanced portfolio risk modeling powered by Monte Carlo simulation. Professional-grade foresight for the modern investor.",
    url: "https://quantmind.co.ke",
    siteName: "QuantMind",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "QuantMind Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuantMind | Institutional Portfolio Intelligence",
    description: "Advanced portfolio risk modeling powered by Monte Carlo simulation.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

import { InitialLoader } from "@/components/ui/InitialLoader";
import { Toaster } from "sonner";
import { UserProvider } from "@/components/UserContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
          body[data-initializing="true"] main, 
          body[data-initializing="true"] section,
          body[data-initializing="true"] footer,
          body[data-initializing="true"] header {
            opacity: 0 !important;
            pointer-events: none !important;
          }
          #critical-loader-bg {
            position: fixed;
            inset: 0;
            background: #05070A;
            z-index: 9999;
            display: block;
          }
          body[data-initializing="false"] #critical-loader-bg {
            display: none;
          }
        ` }} />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${cormorant.variable} antialiased`}
        data-initializing="true"
      >
        <div id="critical-loader-bg" />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <InitialLoader />
            {children}
            <Toaster position="bottom-right" theme="dark" closeButton />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
