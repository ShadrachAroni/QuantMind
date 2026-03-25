'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, HelpCircle, FileText, ChevronDown, ArrowLeft, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';

export default function LegalPage() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const faqs = [
    {
      id: 'q1',
      question: 'How accurate are the Monte Carlo simulations?',
      answer: 'Our QuantCore v4.2 engine utilizes historical volatility and stochastic drift models to achieve a 99% statistical confidence interval (VaR). While past performance does not guarantee future results, our models are calibrated against 20 years of institutional-grade market data.'
    },
    {
      id: 'q2',
      question: 'What assets are supported for modeling?',
      answer: 'Currently, we support global equities (S&P 500, NASDAQ-100), major crypto pairs (BTC, ETH, SOL), and forex majors. Custom asset integration is available for institutional API clients.'
    },
    {
      id: 'q3',
      question: 'Can I cancel my subscription at any time?',
      answer: 'Yes. You can manage and cancel your subscription directly from the Dashboard > Subscription panel. After cancellation, you will maintain access to your tier features until the end of your current billing cycle.'
    },
    {
      id: 'q4',
      question: 'Is my financial data secure?',
      answer: 'QuantMind utilizes AES-256 bank-grade encryption for all stored data. We never store raw credentials and utilize Supabase Auth for high-fidelity identity management.'
    }
  ];

  return (
    <div className="legal-wrap">
      <div className="particles-overlay"></div>
      
      {/* Header */}
      <header className="legal-header">
        <div className="max-width nav-flex">
          <Link href={from} className="back-link">
            <div className="icon-wrap">
              <ArrowLeft size={18} />
            </div>
            <span>Return to Terminal</span>
          </Link>
          <div className="brand">
            <img src="/logo.png" alt="Logo" className="logo-img" />
            <span className="brand-name">QUANTMIND</span>
          </div>
        </div>
      </header>

      <main className="legal-main max-width">
        <div className="hero-section reveal">
          <h1 className="hero-title">Legal & Operations</h1>
          <p className="hero-desc">
            Unified governance, support protocols, and service agreements for the QuantMind intelligence platform.
          </p>
        </div>

        <div className="legal-grid">
          {/* Navigation Sidebar (Anchor links) */}
          <aside className="legal-aside">
            <div className="sticky-nav">
              <a href="#refunds" className="side-link">
                <Shield size={16} /> <span>Refund Policy</span>
              </a>
              <a href="#faq" className="side-link">
                <HelpCircle size={16} /> <span>Frequently Asked</span>
              </a>
              <Link href="/legal/terms" className="side-link">
                <FileText size={16} /> <span>Terms of Service</span>
              </Link>
              <Link href="/legal/privacy" className="side-link">
                <Shield size={16} /> <span>Privacy Policy</span>
              </Link>
              <div className="support-card reveal">
                <label>Need Direct Support?</label>
                <p>Enterprise clients and protocol inquiries.</p>
                <a href="mailto:shadracking7@gmail.com" className="email-link">
                  <Mail size={14} /> shadracking7@gmail.com
                </a>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="legal-content">
            
            {/* Refund Policy */}
            <section id="refunds" className="content-section reveal">
              <GlassCard className="policy-card">
                <div className="section-head">
                  <Shield className="section-icon text-cyan" size={24} />
                  <h2>Refund Policy</h2>
                </div>
                <div className="policy-body">
                  <p>QuantMind is committed to delivering institutional-grade value. We offer a transparent refund framework to ensure user satisfaction across all subscription tiers.</p>
                  
                  <h3>1. Refund Eligibility</h3>
                  <ul>
                    <li><strong>Plus & Pro Tiers:</strong> You are eligible for a full refund within 14 days of your initial purchase if you have utilized fewer than 50 simulation paths.</li>
                    <li><strong>Monthly Renewals:</strong> Monthly renewals are not eligible for refunds. You may cancel at any time to prevent future charges.</li>
                    <li><strong>Annual Plans:</strong> Pro-rated refunds for unused months may be granted at the discretion of the billing team for verified service interruptions.</li>
                  </ul>

                  <h3>2. Process Timeline</h3>
                  <p>Upon verification of eligibility, refunds are processed to the original payment method (Paystack) within 5-10 business days. Bank processing times may vary based on your financial institution.</p>
                  
                  <div className="alert-box">
                    <strong>Notice:</strong> Refund of any subscription tier will immediately terminate access to premium QuantCore engine modules and AI Oracle history.
                  </div>
                </div>
              </GlassCard>
            </section>

            {/* FAQ */}
            <section id="faq" className="content-section reveal">
              <div className="section-head">
                <HelpCircle className="section-icon text-gold" size={24} />
                <h2>Protocol FAQ</h2>
              </div>
              <div className="faq-list">
                {faqs.map((faq) => (
                  <GlassCard 
                    key={faq.id} 
                    className={`faq-item ${activeAccordion === faq.id ? 'active' : ''}`}
                    onClick={() => toggleAccordion(faq.id)}
                  >
                    <div className="faq-question">
                      <span>{faq.question}</span>
                      <ChevronDown size={18} className="chevron" />
                    </div>
                    {activeAccordion === faq.id && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </GlassCard>
                ))}
              </div>
            </section>


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

        /* Header */
        .legal-header {
          height: 80px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(5, 7, 10, 0.8);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
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

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-img { width: 32px; height: 32px; }
        .brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 800; letter-spacing: 0.1em; font-size: 1rem; }

        /* Main Content */
        .legal-main {
          position: relative;
          z-index: 10;
          padding: 4rem 1.5rem 8rem;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 5rem;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          background: linear-gradient(to bottom, #fff, #9090B8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 1.25rem;
          color: #9090B8;
          line-height: 1.6;
        }

        .legal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4rem;
        }

        @media (min-width: 1024px) {
          .legal-grid { grid-template-columns: 280px 1fr; }
        }

        /* Sidebar Nav */
        .sticky-nav {
          position: sticky;
          top: 120px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .side-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          color: #9090B8;
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.3s ease;
          font-weight: 500;
          font-size: 0.9375rem;
        }

        .side-link:hover {
          background: rgba(255,255,255,0.03);
          color: white;
        }

        .side-link.active {
          background: rgba(0, 240, 255, 0.1);
          color: #00F0FF;
        }

        .support-card {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
        }

        .support-card label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #00F0FF;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .support-card p {
          font-size: 0.8125rem;
          color: #9090B8;
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }

        .email-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 600;
          transition: color 0.3s;
        }

        .email-link:hover { color: #00F0FF; }

        /* Content Area */
        .content-section {
          margin-bottom: 6rem;
          scroll-margin-top: 120px;
        }

        .section-head {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .section-head h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .text-cyan { color: #00F0FF; }
        .text-gold { color: #D4A017; }

        :global(.policy-card) {
          padding: 3rem !important;
        }

        .policy-body {
          color: #9090B8;
          line-height: 1.8;
          font-size: 1.0625rem;
        }

        .policy-body h3 {
          color: white;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          margin: 2.5rem 0 1rem;
        }

        .policy-body ul {
          margin-bottom: 1.5rem;
          padding-left: 1.25rem;
        }

        .policy-body li {
          margin-bottom: 0.75rem;
        }

        .policy-body strong { color: white; }

        .alert-box {
          margin-top: 3rem;
          padding: 1.25rem;
          background: rgba(255, 69, 58, 0.05);
          border: 1px solid rgba(255, 69, 58, 0.2);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9375rem;
        }

        .alert-box strong { color: #FF453A; }

        /* FAQ List */
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        :global(.faq-item) {
          padding: 1.5rem 2rem !important;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        :global(.faq-item:hover) {
          border-color: rgba(0, 240, 255, 0.3) !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          font-size: 1.125rem;
          color: white;
        }

        .chevron {
          transition: transform 0.3s ease;
          color: #9090B8;
        }

        :global(.faq-item.active) .chevron {
          transform: rotate(180deg);
          color: #00F0FF;
        }

        .faq-answer {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          color: #9090B8;
          line-height: 1.6;
        }

        /* Reveal Animation */
        .reveal {
          animation: reveal-anim 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @keyframes reveal-anim {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
