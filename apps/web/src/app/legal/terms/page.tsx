'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, FileText, Shield, HelpCircle, Mail } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function TermsPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

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
            <h1 className="hero-title">Institutional Terms</h1>
            <p className="hero-desc">
              The governing framework for the QuantMind intelligence platform.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <GlassCard className="policy-card mb-12">
              <div className="section-head">
                <FileText className="section-icon text-cyan" size={24} />
                <h2>Terms of Service</h2>
              </div>
              <div className="policy-body">
                <p>By accessing the QuantMind terminal, you agree to be bound by these service protocols. These terms constitute a legally binding agreement between you and the QuantCore Engineering team.</p>
                
                <h3>1. Use of Intelligent Systems</h3>
                <p>The QuantMind platform and the AI Portfolio Doctor are for <strong>informational and educational purposes only</strong>. We do not provide financial advice. All simulations are based on mathematical models and do not guarantee market outcomes.</p>

                <h3>2. Intellectual Property</h3>
                <p>All algorithm signatures, QuantCore engine logic, and visual interface components are the exclusive property of QuantMind. Reverse engineering or unauthorized distribution of proprietary risk models is strictly prohibited.</p>

                <h3>3. Limitation of Liability</h3>
                <p>QuantMind shall not be liable for any financial losses resulting from investment decisions made based on simulation results. Users acknowledge that Monte Carlo modeling is a probabilistic framework with inherent synthetic risk.</p>

                <h3>4. Dispute Resolution</h3>
                <p>All discrepancies will be resolved through binding arbitration in Nairobi, Kenya, under the presiding local commercial legal framework.</p>
              </div>
            </GlassCard>

            <div className="flex justify-center gap-8 reveal" style={{ animationDelay: '0.2s' }}>
               <Link href="/legal" className="text-xs text-[#848D97] hover:text-[#00D9FF] uppercase tracking-widest transition-colors font-bold">Protocol_FAQ</Link>
               <Link href="/legal/privacy" className="text-xs text-[#848D97] hover:text-[#00D9FF] uppercase tracking-widest transition-colors font-bold">Privacy_Handshake</Link>
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
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .text-cyan {
          color: #00D9FF;
          filter: drop-shadow(0 0 8px rgba(0, 217, 255, 0.4));
        }

        .policy-body {
          color: #B0B0CC;
          line-height: 1.8;
          font-size: 1.1rem;
        }

        .policy-body h3 {
          color: white;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          margin: 2rem 0 0.75rem;
          letter-spacing: 0.02em;
        }

        .policy-body p {
          margin-bottom: 1.5rem;
        }

        .policy-body strong {
          color: #00D9FF;
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
          :global(.policy-card) { padding: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}
