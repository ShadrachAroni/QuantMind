import { ArrowRight, BarChart3, BrainCircuit, ShieldCheck, Zap, Check } from 'lucide-react';
import Link from 'next/link';
import { SimulationDemo } from '../components/SimulationDemo';

export default function HomePage() {
  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-text">Quant<span className="accent">Mind</span></span>
        </div>
        <div className="nav-links">
          <Link href="#features">Features</Link>
          <Link href="#methodology">Methodology</Link>
          <Link href="/login" className="login-btn">Sign In</Link>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Where <span className="gradient-text">Probability</span> Meets Investing.
          </h1>
          <p className="hero-subtitle">
            Institutional-grade portfolio risk simulation powered by Monte Carlo engines and AI-driven insights. 
            Visualize the unknown. Quantify the tail risk.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="primary-btn">
              Launch Terminal <ArrowRight size={20} />
            </Link>
            <Link href="#demo" className="secondary-btn">View Demo</Link>
          </div>
        </div>
        
        <div className="hero-visual">
          {/* Animated SVG or Chart Illustration Could Go Here */}
          <div className="chart-placeholder">
             <BarChart3 size={120} color="#00D9FF" opacity={0.5} />
          </div>
        </div>
      </main>

      <section id="features" className="features-grid">
        <div className="feature-card">
          <Zap className="feature-icon" color="#00D9FF" />
          <h3>Monte Carlo Suite</h3>
          <p>Run 10,000+ paths using GBM, Jump Diffusion, and Fat-Tail models in seconds.</p>
        </div>
        <div className="feature-card">
          <BrainCircuit className="feature-icon" color="#7C3AED" />
          <h3>AI Risk Assistant</h3>
          <p>Context-aware AI helps you decode complex risk metrics and identify portfolio vulnerabilities.</p>
        </div>
        <div className="feature-card">
          <ShieldCheck className="feature-icon" color="#10B981" />
          <h3>Institutional Grade</h3>
          <p>Trusted VaR, CVaR, and Stress Testing methodologies used by top-tier hedge funds.</p>
        </div>
      </section>

      <section id="demo" className="demo-section">
         <div className="section-intro">
            <h2>Experience the Engine</h2>
            <p>Interactive Monte Carlo simulation running locally in your browser. Feel the power of institutional risk modelling.</p>
         </div>
         <SimulationDemo />
      </section>

      <section id="pricing" className="pricing-section">
         <div className="section-intro text-center">
            <h2>Institutional-Grade Subscription</h2>
            <p>Choose the level of intelligence your capital deserves.</p>
         </div>
         <div className="pricing-grid">
            <div className="price-card">
               <span className="tier-name">Free</span>
               <div className="price">$0<span className="period">/mo</span></div>
               <ul className="tier-features">
                  <li><Check size={16} /> 3 Portfolios</li>
                  <li><Check size={16} /> 2,000 Paths/Sim</li>
                  <li><Check size={16} /> Basic AI Assistant</li>
                  <li><Check size={16} /> GBM Model Only</li>
               </ul>
               <Link href="/signup" className="tier-btn">Start Free</Link>
            </div>
            <div className="price-card featured">
               <span className="tier-name">Pro</span>
               <div className="price">$49<span className="period">/mo</span></div>
               <ul className="tier-features">
                  <li><Check size={16} /> Unlimited Portfolios</li>
                  <li><Check size={16} /> 100,000 Paths/Sim</li>
                  <li><Check size={16} /> Priority AI Access</li>
                  <li><Check size={16} /> All Risk Models</li>
                  <li><Check size={16} /> PDF Risk Reporting</li>
               </ul>
               <Link href="/signup" className="tier-btn primary">Go Pro</Link>
            </div>
         </div>
      </section>

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 0 4rem;
        }

        .navbar {
          height: 80px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .accent {
          color: var(--accent-cyan);
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-links a {
          font-size: 0.9rem;
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: var(--foreground);
        }

        .login-btn {
          padding: 0.5rem 1.5rem;
          border: 1px solid var(--accent-cyan);
          border-radius: 4px;
          color: var(--accent-cyan) !important;
        }

        .hero-section {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
          padding: 6rem 0;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        .gradient-text {
          background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-muted);
          max-width: 600px;
          margin-bottom: 2.5rem;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
        }

        .primary-btn {
          background: var(--accent-cyan);
          color: #000;
          padding: 1rem 2rem;
          border-radius: 4px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .secondary-btn {
          border: 1px solid var(--border-color);
          padding: 1rem 2rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .hero-visual {
           display: flex;
           justify-content: center;
           align-items: center;
           background: radial-gradient(circle at center, rgba(0, 217, 255, 0.1) 0%, transparent 70%);
           border-radius: 50%;
           height: 500px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          padding: 4rem 0;
          border-top: 1px solid var(--border-color);
        }

        .feature-card {
          background: var(--card-bg);
          padding: 2.5rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          transition: transform 0.2s, border-color 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: var(--accent-cyan);
        }

        .feature-icon {
          margin-bottom: 1.5rem;
          width: 48px;
          height: 48px;
        }

        .feature-card h3 {
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }

        .feature-card p {
          color: var(--text-muted);
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .hero-section {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .hero-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .features-grid, .pricing-grid {
            grid-template-columns: 1fr;
          }
          .landing-container {
            padding: 0 1.5rem;
          }
        }

        .section-intro {
          margin-bottom: 3rem;
          max-width: 600px;
        }

        .demo-section, .pricing-section {
          padding: 6rem 0;
          border-top: 1px solid var(--border-color);
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .price-card {
          background: var(--card-bg);
          padding: 3rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .price-card.featured {
          border-color: var(--accent-cyan);
          background: linear-gradient(135deg, var(--card-bg) 0%, rgba(0, 217, 255, 0.05) 100%);
          position: relative;
        }

        .price-card.featured::after {
          content: 'RECOMMENDED';
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 0.7rem;
          background: var(--accent-cyan);
          color: #000;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
        }

        .tier-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--accent-cyan);
          margin-bottom: 1rem;
        }

        .price {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 2rem;
        }

        .period {
          font-size: 1rem;
          color: var(--text-muted);
        }

        .tier-features {
          list-style: none;
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tier-features li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .tier-btn {
          margin-top: auto;
          text-align: center;
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-weight: 700;
        }

        .tier-btn.primary {
          background: var(--accent-cyan);
          color: #000;
          border: none;
        }
      `}</style>
    </div>
  );
}
