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
  metadataBase: new URL('https://quantmind.co.ke'),
  title: "QuantMind | Institutional Portfolio Intelligence",
  description: "Advanced portfolio risk modeling powered by Monte Carlo simulation. Experience the future of investment foresight today.",
  keywords: [
    "QuantMind", "Portfolio Risk", "Monte Carlo Simulation", "Financial Intelligence", 
    "Risk Modeling", "VaR", "CVaR", "Institutional Portfolio Management", 
    "Quantitative Analysis", "Wealth Management", "Financial Risk Software"
  ],
  authors: [{ name: "QuantMind Engineering" }],
  alternates: {
    canonical: '/',
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
    other: {
      "msvalidate.01": "YOUR_BING_VERIFICATION_CODE",
    },
  },
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
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { ConnectivityListener } from "@/components/ConnectivityListener";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${cormorant.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <InitialLoader />
            <ConnectivityListener />
            <MaintenanceGuard>
              {children}
            </MaintenanceGuard>
            <Toaster position="bottom-right" theme="dark" closeButton />
            <SpeedInsights />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
