'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Cpu, Zap, Activity, Info, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function DocsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="docs-wrap">
      <div className="perspective-grid"></div>
      
      <nav className="compact-nav">
        <div className="nav-container max-width">
          <Link href="/" className="back-link">
            <ArrowLeft size={16} />
            <span>Terminal Home</span>
          </Link>
          <div className="brand">
            <div className="brand-logo-container small">
              <img src="/logo.png" alt="Logo" className="nav-logo" />
            </div>
            <span className="brand-name">QUANTMIND Docs</span>
          </div>
        </div>
      </nav>

      <main className="max-width docs-main">
        <header className="page-header reveal slide-up is-visible">
          <span className="header-tag">SYSTEM_DOCUMENTATION_v1.0</span>
          <h1 className="page-title">The QuantCore Protocol</h1>
          <p className="page-subtitle">Mastering Institutional Portfolio Intelligence</p>
        </header>

        <div className="content-grid">
          <aside className="side-nav reveal fade-in delay-1 is-visible">
            <div className="nav-group">
              <label>Foundations</label>
              <Link href="#overview" className="side-link active">Architecture Overview</Link>
              <Link href="#engine" className="side-link">QuantCore Engine</Link>
            </div>
            <div className="nav-group">
              <label>Capabilities</label>
              <Link href="#oracle" className="side-link">AI Oracle (LLM)</Link>
              <Link href="#monitoring" className="side-link">Real-Time Risk HUD</Link>
              <Link href="#subscriptions" className="side-link">Subscription Hierarchy</Link>
            </div>
          </aside>

          <div className="main-content reveal slide-up delay-2 is-visible">
            <section id="overview">
              <GlassCard className="docs-section" intensity="medium">
                <div className="section-header">
                  <div className="section-icon"><BookOpen size={24} /></div>
                  <h2>System Architecture</h2>
                </div>
                <p>
                  QuantMind is built on a distributed compute architecture designed for low-latency financial simulations. Our stack reconciles high-frequency market feeds with massive-scale Monte Carlo parallelization to provide a unified risk-frontier for retail and institutional investors.
                </p>
                <div className="info-box">
                  <Info size={18} />
                  <span>The platform utilizes Supabase Realtime for price propagation and isolated Deno edge-nodes for simulation compute.</span>
                </div>
              </GlassCard>
            </section>

            <section id="engine">
              <GlassCard className="docs-section" intensity="medium">
                <div className="section-header">
                  <div className="section-icon"><Cpu size={24} /></div>
                  <h2>The QuantCore Engine</h2>
                </div>
                <p>
                  At the heart of QuantMind is the <strong>QuantCore v4.2</strong> engine. Unlike standard linear projections, QuantCore utilizes iterative stochastic modeling to account for market "fat tails" and non-normal distribution stressors.
                </p>
                <div className="tech-specs">
                  <div className="spec-item">
                    <span className="spec-label">Methodology</span>
                    <span className="spec-val">Stochastic Monte Carlo</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Path Count</span>
                    <span className="spec-val">10,000 / Simulation</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Risk Horizon</span>
                    <span className="spec-val">99% VaR (Value-at-Risk)</span>
                  </div>
                </div>
              </GlassCard>
            </section>

            <section id="oracle">
              <GlassCard className="docs-section" intensity="medium">
                <div className="section-header">
                  <div className="section-icon"><Zap size={24} /></div>
                  <h2>AI Portfolio Doctor</h2>
                </div>
                <p>
                  Our LLM-integrated assistant (AI Oracle) translates raw simulation telemetry into actionable strategy refinements. By correlating historical crash patterns with your current portfolio delta, the AI Oracle identifies specific structural weaknesses.
                </p>
                <pre className="code-block">
                  <code>
                    GET /api/v1/oracle/analyze?portfolio_id=QX-772
                    {"\n"}{"\n"}
                    // Returns structural hedge recommendations 
                    // based on correlated synthetic market stressors.
                  </code>
                </pre>
              </GlassCard>
            </section>

            <section id="monitoring">
              <GlassCard className="docs-section" intensity="medium">
                <div className="section-header">
                  <div className="section-icon"><Activity size={24} /></div>
                  <h2>Real-Time Risk HUD</h2>
                </div>
                <p>
                  The Dashboard HUD provides a continuous visual representation of your portfolio's stress-threshold. We utilize Fan-Chart visualizations to display the probabilistic distribution of your wealth over time under various volatility regimes.
                </p>
              </GlassCard>
            </section>

            <section id="subscriptions">
              <GlassCard className="docs-section" intensity="medium">
                <div className="section-header">
                  <div className="section-icon"><ShieldCheck size={24} /></div>
                  <h2>Subscription Hierarchy</h2>
                </div>
                <p>
                  QuantMind utilizes a four-tier access model to balance retail accessibility with institutional compute power.
                </p>
                <div className="tier-grid">
                   <div className="tier-item">
                      <h4 className="text-[#848D97]">FREE (Explorer)</h4>
                      <p className="text-sm">1 Portfolio, Basic Monte Carlo, Community Support.</p>
                   </div>
                   <div className="tier-item">
                      <h4 className="text-[#00D9FF]">STUDENT (Academic)</h4>
                      <p className="text-sm">3 Portfolios, Standard Simulations, Educational Datasets.</p>
                   </div>
                   <div className="tier-item">
                      <h4 className="text-[#7C3AED]">PLUS (QuantMind Plus)</h4>
                      <p className="text-sm">5 Portfolios, AI Strategy Insights, Advanced Risk Metrics.</p>
                   </div>
                   <div className="tier-item">
                      <h4 className="text-[#FFD60A]">PRO (QuantMind Pro)</h4>
                      <p className="text-sm">Unlimited Portfolios, Full Interactive Oracle, Custom Models.</p>
                   </div>
                </div>
                <div className="info-box mt-8">
                   <Info size={18} />
                   <span>Upgrades take effect instantly. Downgrades are processed at the end of the billing cycle. Data is preserved across all tiers.</span>
                </div>
              </GlassCard>
            </section>
          </div>
        </div>
      </main>

      <footer className="compact-footer">
        <div className="max-width">
          <p>© 2026 QuantMind Intelligence Hub · Confidential Documentation · Built for the Next Market Frontier</p>
        </div>
      </footer>

      <style jsx>{`
        .docs-wrap {
          background-color: #080810;
          color: white;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .perspective-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          perspective: 1000px;
          transform: rotateX(60deg) translateY(-200px);
          mask-image: radial-gradient(ellipse at center, black, transparent 80%);
          z-index: 0;
          opacity: 0.2;
        }

        .max-width {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .compact-nav {
          padding: 2rem 0;
          position: relative;
          z-index: 10;
        }

        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #9090B8;
          text-decoration: none;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          transition: all 0.3s;
        }

        .back-link:hover {
          color: #00F0FF;
          transform: translateX(-5px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .brand-logo-container.small {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }

        .nav-logo { width: 100%; height: auto; }
        .brand-name { font-weight: 900; letter-spacing: 0.2em; font-size: 0.8rem; color: #00F0FF; text-transform: uppercase; }

        .docs-main {
          position: relative;
          z-index: 10;
          padding: 4rem 2rem 8rem;
        }

        .page-header {
          margin-bottom: 5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 4rem;
        }

        .header-tag {
          font-family: 'JetBrains Mono', monospace;
          color: #00F0FF;
          font-size: 0.65rem;
          letter-spacing: 0.3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .page-title {
          font-size: clamp(2.5rem, 8vw, 4rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          line-height: 1;
        }

        .page-subtitle {
          color: #9090B8;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 0.85rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4rem;
        }

        @media (min-width: 1024px) {
          .content-grid { grid-template-columns: 280px 1fr; }
        }

        .side-nav {
          display: flex;
          flex-direction: column;
          gap: 3rem;
          position: sticky;
          top: 4rem;
          height: fit-content;
        }

        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .nav-group label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          font-weight: 700;
          color: rgba(144, 144, 184, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.2rem;
          margin-bottom: 0.5rem;
        }

        .side-link {
          color: #9090B8;
          text-decoration: none;
          font-size: 0.8rem;
          font-family: 'Space Grotesk', sans-serif;
          padding: 0.4rem 0;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .side-link.active, .side-link:hover {
          color: #00F0FF;
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
        }

        .main-content {
          display: flex;
          flex-direction: column;
          gap: 5rem;
        }

        :global(.docs-section) {
          padding: 3rem !important;
          scroll-margin-top: 4rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .section-icon {
          color: #00F0FF;
          opacity: 0.8;
          filter: drop-shadow(0 0 10px rgba(0,240,255,0.3));
        }

        h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1rem;
          color: white;
        }

        p {
          color: #9090B8;
          line-height: 1.8;
          font-size: 1.125rem;
          margin-bottom: 1.5rem;
        }

        .info-box {
          background: rgba(0, 240, 255, 0.05);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .info-box span {
          color: #00F0FF;
          font-size: 0.875rem;
          font-style: italic;
        }

        .tech-specs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .spec-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          color: rgba(144, 144, 184, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.2rem;
        }

        .spec-val {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: white;
        }

        .code-block {
          background: #04040a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 2rem;
          overflow-x: auto;
        }

        code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          line-height: 1.6;
          color: #9090B8;
          white-space: pre-wrap;
        }

        .compact-footer {
          padding: 6rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          color: rgba(144, 144, 184, 0.2);
          font-size: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.15rem;
        }

        /* Animations */
        .reveal { opacity: 0; transform: translateY(30px); transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .reveal.is-visible { opacity: 1; transform: translateY(0); }
        .delay-1 { transition-delay: 0.2s; }
        .delay-2 { transition-delay: 0.4s; }

        .tier-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .tier-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .tier-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .tier-item h4 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1rem;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
}
