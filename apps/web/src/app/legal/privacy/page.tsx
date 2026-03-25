'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Lock, EyeOff, FileText } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function PrivacyPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="legal-wrap">
      <div className="particles-overlay" />
      
      <main className="relative z-10 pt-32 pb-20">
        <div className="max-width">
          <Link href={from} className="back-link">
            <div className="icon-wrap">
              <ArrowLeft size={18} />
            </div>
            <span>Return to Terminal</span>
          </Link>

          <div className="hero-section reveal">
            <h1 className="hero-title">Privacy & Data Governance</h1>
            <p className="hero-desc">
              Node Security Protocol v.4.0 • Synchronized: {mounted ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'MARCH 2026'}
            </p>
          </div>

          <div className="max-w-4xl mx-auto main-content">
            <GlassCard className="policy-section reveal" intensity="medium" id="commitment" style={{ animationDelay: '0.1s' }}>
              <div className="section-head">
                <ShieldCheck className="text-cyan" size={28} />
                <h2>01. Institutional Commitment</h2>
              </div>
              <p className="policy-text">
                QuantMind operates on a "Privacy by Design" architecture. We acknowledge that your portfolio data is your most valuable intellectual property. Our systems are engineered to provide maximum predictive insight without ever compromising the confidentiality of your underlying strategies.
              </p>
            </GlassCard>

            <GlassCard className="policy-section reveal" intensity="medium" id="collection" style={{ animationDelay: '0.2s' }}>
              <div className="section-head">
                <EyeOff className="text-cyan" size={28} />
                <h2>02. Data Acquisition</h2>
              </div>
              <p className="policy-text">We collect only the telemetry necessary to execute high-fidelity simulations:</p>
              <ul className="telemetry-list">
                <li><strong>Portfolio Identifiers:</strong> Asset tickers and quantity data required for Monte Carlo engine input.</li>
                <li><strong>Authentication Data:</strong> Secure identifiers managed via Supabase Auth with mandatory 2FA support.</li>
                <li><strong>Session Metrics:</strong> Performance telemetry to optimize simulation latency and node stability.</li>
              </ul>
            </GlassCard>

            <GlassCard className="policy-section reveal" intensity="medium" id="usage" style={{ animationDelay: '0.3s' }}>
              <div className="section-head">
                <FileText className="text-cyan" size={28} />
                <h2>03. Algorithmic Processing</h2>
              </div>
              <p className="policy-text">
                Your data is exclusively used to generate risk reports and AI-driven insights. QuantMind does not engage in side-loading, selling, or marketing derived from your strategy telemetry. All processing occurs within isolated compute nodes that are purged upon session termination or user-initiated deletion.
              </p>
            </GlassCard>

            <GlassCard className="policy-section reveal" intensity="medium" id="security" style={{ animationDelay: '0.4s' }}>
              <div className="section-head">
                <Lock className="text-cyan" size={28} />
                <h2>04. Node Security</h2>
              </div>
              <p className="policy-text">
                Data in transit is protected via TLS 1.3. Data at rest is encrypted using AES-256 standard. Our integration with Paystack ensures that financial transactions never touch our primary compute nodes, maintaining a clear separation of financial and strategy data.
              </p>
            </GlassCard>
            
            <div className="flex justify-center gap-8 py-8 reveal" style={{ animationDelay: '0.5s' }}>
               <Link href="/legal" className="text-xs text-[#848D97] hover:text-[#00D9FF] uppercase tracking-widest transition-colors font-bold">Protocol_FAQ</Link>
               <Link href="/legal/terms" className="text-xs text-[#848D97] hover:text-[#00D9FF] uppercase tracking-widest transition-colors font-bold">Institutional_Terms</Link>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .legal-wrap {
          background: #05070A;
          color: white;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .particles-overlay {
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .max-width {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: #848D97;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15rem;
          margin-bottom: 2.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0.5rem 0;
        }

        .icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.02);
          transition: all 0.4s ease;
        }

        .back-link span {
          position: relative;
          top: 1px; /* Optical alignment offset for DM Sans */
        }

        .back-link:hover {
          color: #00D9FF;
          transform: translateX(-4px);
        }

        .hero-section {
          text-align: center;
          margin-bottom: 5rem;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          background: linear-gradient(to bottom, #fff, #9090B8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.1rem;
          color: #848D97;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .section-head {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 1.5rem;
        }

        .section-head h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .text-cyan {
          color: #00D9FF;
          filter: drop-shadow(0 0 8px rgba(0, 217, 255, 0.4));
        }

        .policy-text {
          color: #B0B0CC;
          line-height: 1.8;
          font-size: 1.1rem;
        }

        .telemetry-list {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-left: 1rem;
        }

        .telemetry-list li {
          list-style: none;
          position: relative;
          color: #B0B0CC;
          font-size: 1rem;
        }

        .telemetry-list li::before {
          content: "";
          position: absolute;
          left: -1.5rem;
          top: 0.65rem;
          width: 4px;
          height: 4px;
          background: #00D9FF;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
        }

        .telemetry-list strong {
          color: white;
          font-weight: 600;
        }

        :global(.policy-section) {
          padding: 3rem !important;
        }

        .reveal {
          opacity: 0;
          animation: reveal-anim 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes reveal-anim {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          :global(.policy-section) { padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
