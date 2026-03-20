import { ArrowRight, BarChart3, BrainCircuit, ShieldCheck, Zap, Check, TrendingUp, Cpu, Globe, MessageSquare, PieChart, Activity } from 'lucide-react';
import Link from 'next/link';
import { SimulationDemo } from '../components/SimulationDemo';
import { GlassCard } from '../components/ui/GlassCard';
import { GlowEffect } from '../components/ui/GlowEffect';

export default function HomePage() {
  return (
    <div className="landing-container">
      <GlowEffect color="var(--accent-cyan)" size={1000} style={{ top: '-400px', right: '-300px', opacity: 0.1 }} />
      <GlowEffect color="var(--accent-purple)" size={800} style={{ bottom: '-300px', left: '-200px', opacity: 0.08 }} />

      <nav className="navbar">
        <div className="logo">
           <Zap size={24} fill="var(--accent-cyan)" color="var(--accent-cyan)" />
           <span className="logo-text mono">QUANT_MIND<span className="version">V1.0</span></span>
        </div>
        <div className="nav-links">
          <Link href="#features" className="mono">INTELLIGENCE</Link>
          <Link href="#engine" className="mono">THE_ENGINE</Link>
          <Link href="#pricing" className="mono">PRICING</Link>
          <Link href="/login" className="login-btn mono">TERMINAL_SIGN_IN</Link>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <div className="badge mono">INSTITUTIONAL_GRADE_ENGINE</div>
          <h1 className="hero-title">
            INVEST WITH <span className="gradient-text uppercase">FORESIGHT</span>. NOT JUST HINDSIGHT.
          </h1>
          <p className="hero-subtitle">
            Professional-grade portfolio risk intelligence in your pocket. Powered by Monte Carlo simulation, 
            Bayesian inference, and AI-driven volatility analysis.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="primary-btn mono">
              LAUNCH_TERMINAL <ArrowRight size={18} />
            </Link>
            <Link href="#demo" className="secondary-btn mono">TRY_THE_ENGINE</Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <GlassCard intensity="high" className="visual-card">
             <div className="card-header">
                <TrendingUp size={16} color="var(--accent-cyan)" />
                <span className="mono">LIVE_SIM_V4.2</span>
             </div>
             <div className="card-body">
                <BarChart3 size={120} color="var(--accent-cyan)" className="floating-icon" />
                <div className="viz-waves">
                   <div className="wave wave-1" />
                   <div className="wave wave-2" />
                </div>
             </div>
             <div className="card-footer mono">
                <span>95%_VAR::STABLE</span>
                <span>VOL_SKEW::NORMAL</span>
             </div>
          </GlassCard>
        </div>
      </main>

      <section id="features" className="features-section">
        <div className="section-intro center">
           <div className="badge mono">CAPABILITIES</div>
           <h2 className="uppercase">MASTER_COMPLEXITY</h2>
           <p>Engineered for high-stakes capital management.</p>
        </div>

        <div className="features-grid">
          <GlassCard className="feature-card" intensity="low">
            <div className="icon-box cyan">
              <Cpu size={24} />
            </div>
            <h3 className="mono">MONTE_CARLO_FRAMEWORK</h3>
            <p>Run 10,000 parallel market realities to understand every possible outcome of your strategy in sub-second latency.</p>
          </GlassCard>
          
          <GlassCard className="feature-card" intensity="low">
            <div className="icon-box purple">
              <BrainCircuit size={24} />
            </div>
            <h3 className="mono">AI_PORTFOLIO_DOCTOR</h3>
            <p>Ask our LLM-powered assistant to analyze simulation results and suggest structural hedge improvements in real-time.</p>
          </GlassCard>
          
          <GlassCard className="feature-card" intensity="low">
            <div className="icon-box success">
              <Activity size={24} />
            </div>
            <h3 className="mono">REAL-TIME_RISK_MONITORING</h3>
            <p>Continuous calculation of VAR and Max Drawdown against historical and synthetic market stressors.</p>
          </GlassCard>
        </div>
      </section>

      <section id="demo" className="demo-section">
         <div className="section-intro">
            <div className="status-indicator">
               <div className="pulse-dot" />
               <span className="mono">ENGINE_ONLINE</span>
            </div>
            <h2>LIVE_COMPUTATION_DEMO</h2>
            <p>Interactive Monte Carlo simulation running locally. Experience institutional modelling at the edge.</p>
         </div>
         <GlassCard className="demo-wrapper" intensity="medium">
            <SimulationDemo />
            <div className="demo-cta">
               <Link href="/dashboard" className="mono link-btn">RUN_10,000_PATHS_IN_THE_APP →</Link>
            </div>
         </GlassCard>
      </section>

      <section id="pricing" className="pricing-section">
         <div className="section-intro center">
            <h2 className="uppercase">SERVICE_TIERS</h2>
            <p>Intelligence tailored to your capital management requirements.</p>
         </div>
         <div className="pricing-grid">
            <GlassCard className="price-card" intensity="low">
               <span className="tier-name mono">ESSENTIAL</span>
               <div className="price">$0<span className="period">/MO</span></div>
               <ul className="tier-features mono">
                  <li><Check size={14} color="var(--accent-cyan)" /> 10_SIMULATION_RUNS</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> BASIC_ASSET_CLASSES</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> STANDARD_SUPPORT</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> GBM_MODEL_ENGINE</li>
               </ul>
               <Link href="/signup" className="tier-btn mono">INITIALIZE_FREE</Link>
            </GlassCard>

            <GlassCard className="price-card featured" intensity="high">
               <div className="featured-badge mono">HIGH_OUTPUT</div>
               <span className="tier-name mono">PROFESSIONAL</span>
               <div className="price">$49<span className="period">/MO</span></div>
               <ul className="tier-features mono">
                  <li><Check size={14} color="var(--accent-cyan)" /> UNLIMITED_SIMULATIONS</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> GLOBAL_ASSET_UNIVERSE</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> ADVANCED_AI_DOCTOR</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> API_ACCESS_BETA</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> PDF_RISK_REPORTING</li>
               </ul>
               <Link href="/signup" className="tier-btn primary mono">UPGRADE_TO_PRO</Link>
            </GlassCard>

            <GlassCard className="price-card" intensity="low">
               <span className="tier-name mono">INSTITUTIONAL</span>
               <div className="price">CUSTOM</div>
               <ul className="tier-features mono">
                  <li><Check size={14} color="var(--accent-cyan)" /> MULTI-USER_TEAM_DASH</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> CUSTOM_STRESS_SCENARIOS</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> DEDICATED_RISK_ANALYST</li>
                  <li><Check size={14} color="var(--accent-cyan)" /> SLA_CREDITS</li>
               </ul>
               <Link href="/contact" className="tier-btn mono">CONTACT_SALES</Link>
            </GlassCard>
         </div>
      </section>

      <footer className="footer">
         <div className="footer-content">
            <div className="footer-brand">
               <div className="logo mb-4">
                  <Zap size={20} fill="var(--accent-cyan)" color="var(--accent-cyan)" />
                  <span className="logo-text mono">QUANT_MIND</span>
               </div>
               <p className="text-muted text-sm max-w-xs font-light leading-relaxed">
                  The future of portfolio intelligence. We bring institutional-grade risk modeling to the modern investor.
               </p>
            </div>
            
            <div className="footer-links">
               <div className="footer-col">
                  <h4 className="mono uppercase text-xs mb-6 tracking-widest">PRODUCT</h4>
                  <Link href="#features">Risk Engine</Link>
                  <Link href="/api">Monte Carlo API</Link>
                  <Link href="/docs">Documentation</Link>
                  <Link href="/roadmap">Roadmap</Link>
               </div>
               <div className="footer-col">
                  <h4 className="mono uppercase text-xs mb-6 tracking-widest">COMPANY</h4>
                  <Link href="/about">About Us</Link>
                  <Link href="/contact">Contact</Link>
                  <Link href="/privacy">Privacy Policy</Link>
                  <Link href="/terms">Terms of Service</Link>
               </div>
               <div className="footer-col">
                  <h4 className="mono uppercase text-xs mb-6 tracking-widest">SOCIAL</h4>
                  <a href="#">Twitter/X</a>
                  <a href="#">LinkedIn</a>
                  <a href="#">GitHub</a>
                  <a href="#">Discord</a>
               </div>
            </div>
         </div>
         <div className="footer-bottom mono text-center">
            &copy; 2026 QUANTMIND_LABS // ALL_RIGHTS_RESERVED // SYSTEM_STABLE_V1.0
         </div>
      </footer>

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 0 5%;
          background: var(--background);
          overflow-x: hidden;
        }

        .navbar {
          height: 100px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }

        .logo {
           display: flex;
           align-items: center;
           gap: 1rem;
        }

        .logo-text {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .version {
           font-size: 0.6rem;
           background: rgba(255, 255, 255, 0.05);
           padding: 2px 6px;
           border-radius: 4px;
           margin-left: 0.75rem;
           color: var(--text-muted);
        }

        .nav-links {
          display: flex;
          gap: 3rem;
          align-items: center;
        }

        .nav-links a {
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 1px;
        }

        .nav-links a:hover {
          color: #fff;
        }

        .login-btn {
          padding: 0.75rem 1.5rem;
          border: 1px solid var(--accent-cyan);
          border-radius: 8px;
          color: var(--accent-cyan) !important;
          background: rgba(0, 217, 255, 0.05);
        }

        .hero-section {
          flex: 1;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          align-items: center;
          gap: 6rem;
          padding: 8rem 0;
        }

        .badge {
           font-size: 0.7rem;
           color: var(--accent-cyan);
           letter-spacing: 2px;
           background: rgba(0, 217, 255, 0.1);
           padding: 4px 12px;
           border-radius: 4px;
           display: inline-block;
           margin-bottom: 1.5rem;
           border: 1px solid rgba(0, 217, 255, 0.2);
        }

        .hero-title {
          font-size: 4.5rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 2rem;
          letter-spacing: -2px;
        }

        .gradient-text {
          background: linear-gradient(90deg, #fff, var(--accent-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-muted);
          max-width: 650px;
          margin-bottom: 3.5rem;
          line-height: 1.7;
          font-weight: 300;
        }

        .hero-actions {
          display: flex;
          gap: 1.5rem;
        }

        .primary-btn {
          background: #fff;
          color: #000;
          padding: 1.2rem 2.5rem;
          border-radius: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.85rem;
        }

        .secondary-btn {
          border: 1px solid var(--border-color);
          padding: 1.2rem 2.5rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          background: rgba(255, 255, 255, 0.02);
        }

        .hero-visual {
           height: 500px;
           display: flex;
           justify-content: center;
           align-items: center;
        }

        .visual-card {
           width: 100%;
           height: 400px;
           padding: 2rem;
           display: flex;
           flex-direction: column;
           box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
        }

        .card-header {
           display: flex;
           justify-content: space-between;
           margin-bottom: 2rem;
           font-size: 0.7rem;
           color: var(--text-muted);
        }

        .card-body {
           flex: 1;
           display: flex;
           flex-direction: column;
           align-items: center;
           justify-content: center;
           position: relative;
        }

        .floating-icon {
           filter: drop-shadow(0 0 20px var(--accent-cyan));
           animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
           0%, 100% { transform: translateY(0); }
           50% { transform: translateY(-20px); }
        }

        .viz-waves {
           position: absolute;
           bottom: 0;
           width: 100%;
           height: 100px;
           opacity: 0.3;
        }

        .wave {
           position: absolute;
           bottom: 0;
           height: 100%;
           width: 200%;
           background-image: linear-gradient(to top, var(--accent-cyan), transparent);
           clip-path: polygon(0% 45%, 16% 44%, 33% 50%, 54% 60%, 70% 61%, 84% 59%, 100% 52%, 100% 100%, 0% 100%);
        }

        .card-footer {
           border-top: 1px solid rgba(255, 255, 255, 0.05);
           padding-top: 1.5rem;
           display: flex;
           justify-content: space-between;
           font-size: 0.65rem;
           color: var(--accent-cyan);
        }

        .features-section {
           padding: 10rem 0;
           border-top: 1px solid var(--border-color);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.5rem;
          margin-top: 4rem;
        }

        .feature-card {
          padding: 3rem;
        }

        .icon-box {
           width: 56px;
           height: 56px;
           border-radius: 14px;
           display: flex;
           align-items: center;
           justify-content: center;
           margin-bottom: 2.5rem;
        }

        .icon-box.cyan { background: rgba(0, 217, 255, 0.1); color: var(--accent-cyan); border: 1px solid rgba(0, 217, 255, 0.2); }
        .icon-box.purple { background: rgba(124, 58, 237, 0.1); color: var(--accent-purple); border: 1px solid rgba(124, 58, 237, 0.2); }
        .icon-box.success { background: rgba(50, 215, 75, 0.1); color: var(--success); border: 1px solid rgba(50, 215, 75, 0.2); }

        .feature-card h3 {
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
          letter-spacing: 1px;
        }

        .feature-card p {
          color: var(--text-muted);
          line-height: 1.7;
          font-size: 0.95rem;
          font-weight: 300;
        }

        .demo-section {
          padding: 10rem 0;
          border-top: 1px solid var(--border-color);
        }

        .status-indicator {
           display: flex;
           align-items: center;
           gap: 0.75rem;
           margin-bottom: 1rem;
        }

        .pulse-dot {
           width: 8px;
           height: 8px;
           background: var(--success);
           border-radius: 50%;
           box-shadow: 0 0 10px var(--success);
           animation: pulse 2s infinite;
        }

        .status-indicator span {
           font-size: 0.65rem;
           color: var(--success);
           letter-spacing: 2px;
        }

        .section-intro h2 {
           font-size: 2.5rem;
           font-weight: 800;
           margin-bottom: 1.5rem;
           letter-spacing: -1px;
        }

        .section-intro p {
           color: var(--text-muted);
           font-size: 1.1rem;
           font-weight: 300;
        }

        .demo-wrapper {
           padding: 3rem;
           margin-top: 4rem;
        }

        .demo-cta {
           text-align: center;
           margin-top: 3rem;
           padding-top: 2rem;
           border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .link-btn {
           font-size: 0.8rem;
           color: var(--accent-cyan);
           letter-spacing: 1px;
           font-weight: 700;
           transition: opacity 0.2s;
        }

        .link-btn:hover { opacity: 0.7; }

        .pricing-section {
          padding: 10rem 0;
          border-top: 1px solid var(--border-color);
        }

        .center { text-align: center; margin: 0 auto; }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.5rem;
          max-width: 1200px;
          margin: 4rem auto 0;
        }

        .price-card {
          padding: 4rem 3rem;
          display: flex;
          flex-direction: column;
        }

        .price-card.featured {
          border-color: var(--accent-cyan) !important;
          background: rgba(0, 217, 255, 0.02) !important;
          position: relative;
          transform: scale(1.05);
          z-index: 10;
        }

        .featured-badge {
           position: absolute;
           top: 2rem;
           right: 2rem;
           font-size: 0.6rem;
           color: #000;
           background: var(--accent-cyan);
           padding: 3px 8px;
           border-radius: 4px;
           font-weight: 900;
        }

        .tier-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-cyan);
          margin-bottom: 2rem;
          letter-spacing: 1.5px;
        }

        .price {
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 3rem;
          letter-spacing: -2px;
        }

        .period {
          font-size: 1rem;
          color: var(--text-muted);
          font-weight: 400;
          letter-spacing: 0;
        }

        .tier-features {
          list-style: none;
          margin-bottom: 4rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .tier-features li {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.5px;
        }

        .tier-btn {
          margin-top: auto;
          text-align: center;
          padding: 1.25rem;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.8rem;
          letter-spacing: 1px;
        }

        .tier-btn.primary {
          background: var(--accent-cyan);
          color: #000;
          border: none;
        }

        .footer {
           padding: 8rem 5% 4rem;
           background: rgba(0, 0, 0, 0.2);
           border-top: 1px solid var(--border-color);
        }

        .footer-content {
           display: grid;
           grid-template-columns: 1fr 1.5fr;
           gap: 6rem;
           margin-bottom: 6rem;
        }

        .footer-links {
           display: grid;
           grid-template-columns: repeat(3, 1fr);
           gap: 4rem;
        }

        .footer-col {
           display: flex;
           flex-direction: column;
           gap: 1.25rem;
        }

        .footer-col a {
           font-size: 0.85rem;
           color: var(--text-muted);
           transition: color 0.2s;
           font-weight: 300;
        }

        .footer-col a:hover {
           color: #fff;
        }

        .footer-bottom {
           padding-top: 4rem;
           border-top: 1px solid rgba(255, 255, 255, 0.05);
           font-size: 0.65rem;
           color: var(--text-muted);
           letter-spacing: 2px;
        }

        @keyframes pulse {
           0% { transform: scale(0.9); opacity: 0.5; }
           50% { transform: scale(1.1); opacity: 1; }
           100% { transform: scale(0.9); opacity: 0.5; }
        }

        @media (max-width: 1200px) {
           .hero-section { grid-template-columns: 1fr; text-align: center; }
           .hero-content { display: flex; flex-direction: column; align-items: center; }
           .hero-visual { display: none; }
           .features-grid, .pricing-grid { grid-template-columns: 1fr; }
           .hero-title { font-size: 3.5rem; }
           .footer-content { grid-template-columns: 1fr; gap: 4rem; }
           .price-card.featured { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
