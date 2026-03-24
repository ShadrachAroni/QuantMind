'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false);
  const [volatility, setVolatility] = useState(15);
  
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const fanChartCanvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Intersection Observer for Reveal Animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Particles Background with Mouse Interaction
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationId: number;

    const initParticles = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const count = window.innerWidth < 768 ? 80 : 150;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          baseOpacity: Math.random() * 0.5 + 0.1,
          opacity: 0
        });
      }
    };

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;

      particles.forEach(p => {
        // Basic movement
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Mouse interaction (repulsion)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.x += (dx / dist) * force * 2;
          p.y += (dy / dist) * force * 2;
          p.opacity = Math.min(1, p.baseOpacity + force);
        } else {
          p.opacity = p.baseOpacity;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity * 0.6})`;
        ctx.fill();
        
        // Subtle glow
        if (dist < 150) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#00f0ff';
        } else {
          ctx.shadowBlur = 0;
        }
      });
      animationId = requestAnimationFrame(animateParticles);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', initParticles);
    window.addEventListener('mousemove', handleMouseMove);
    initParticles();
    animateParticles();

    return () => {
      window.removeEventListener('resize', initParticles);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Fan Chart Logic
  useEffect(() => {
    const canvas = fanChartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFanChart = (vol: number) => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;
      const steps = 60;
      const paths = 40;

      ctx.clearRect(0, 0, w, h);
      
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for(let i=0; i<w; i+=w/10) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < paths; i++) {
        let currentY = centerY;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        
        const opacity = (1 - Math.abs(i - paths/2) / (paths/2)) * 0.3;
        ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;

        for (let j = 1; j <= steps; j++) {
          const x = (j / steps) * w;
          const drift = (j / steps) * -20; 
          const spread = (vol / 50) * (j / steps) * 80;
          const noise = (Math.random() - 0.5) * spread;
          currentY = centerY + drift + noise * (i - paths/2) * 0.15;
          ctx.lineTo(x, currentY);
        }
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.strokeStyle = 'rgba(0, 240, 255, 1)';
      ctx.lineWidth = 2;
      for (let j = 1; j <= steps; j++) {
        const x = (j / steps) * w;
        const drift = (j / steps) * -20;
        ctx.lineTo(x, centerY + drift);
      }
      ctx.stroke();
    };

    drawFanChart(volatility);
    const handleResize = () => drawFanChart(volatility);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [volatility]);

  // Card Tilt Handler
  const handleCardTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
  };

  const resetCardTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--rotate-x', '0deg');
    e.currentTarget.style.setProperty('--rotate-y', '0deg');
  };

  return (
    <div className="landing-wrap">
      <canvas ref={particleCanvasRef} className="particle-canvas" />

      {/* Navigation */}
      <nav className="main-nav">
        <div className="nav-container max-width">
          <div className="brand">
            <div className="brand-logo">
              <div className="logo-inner"></div>
            </div>
            <span className="brand-name">QUANTMIND</span>
          </div>
          <div className="nav-links">
            <Link href="#features">Intelligence</Link>
            <Link href="#engine">The Engine</Link>
            <Link href="#pricing">Pricing</Link>
          </div>
          <button className="nav-cta shimmer">Client Login</button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="perspective-grid"></div>
          <div className="hero-container max-width reveal slide-up">
            <div className="hero-content">
              <h1 className="hero-title">
                Invest with foresight.<br/>
                <span className="hero-title-white">Not just hindsight.</span>
              </h1>
              <p className="hero-lead">
                Professional-grade portfolio risk intelligence in your pocket. Powered by Monte Carlo simulation.
              </p>
              <div className="hero-buttons">
                <button className="btn-primary shimmer">Download App</button>
                <button className="btn-secondary">Watch Demo</button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="visual-glow"></div>
              <div className="phone-mockup">
                <img 
                  alt="App Preview" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1IO8x1ubI3t3yBwpQZfuv2Zl73EWVlN2CEKJQk-_fLzYa1HKXHzNoL7Ny4Rrva0JUUpyblX4pCTYKsqr7ddfatD7OCy_frI9IPgEkEuto5tFp2zY_FSUm57HG1zHaqkCZ1jJRz0cRbVLspelm3Lt6qTTa0pYhM_D3xZ6cWS4ZqkWgLwWdYxfefFNL6nDhJwJDLSW12g1bYtMUReS2-EkJ28SHiXDT1pnrQuiz6lFNS0-03qrWfcn46wWBpyRMHEkO6VBN_gM3VD63"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-section">
          <div className="stats-container max-width">
            {['$1.2B', '450K', '4.9'].map((val, i) => (
              <div key={i} className={`stat-item reveal fade-in delay-${i+1}`}>
                <span className="stat-value">{val}</span>
                <span className="stat-label">{['Assets Modeled', 'Simulations', 'App Rating'][i]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="features-section">
          <div className="section-header max-width reveal slide-up">
            <h2 className="section-title">Master Complexity</h2>
            <div className="title-underline"></div>
          </div>
          <div className="features-grid max-width">
            {[
              { icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', name: 'Monte Carlo Framework', desc: 'Run 10,000 parallel market realities to understand every possible outcome of your strategy.' },
              { icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15L17.5 17.625 14.875 18.375 17.5 19.125 18.25 21.75 19 19.125 21.625 18.375 19 17.625 18.25 15z', name: 'AI Portfolio Doctor', desc: 'Ask our LLM-powered assistant to analyze simulation results and suggest structural hedge improvements.' },
              { icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', name: 'Real-Time Risk Monitoring', desc: 'Continuous calculation of VAR and Max Drawdown against historical and synthetic market stressors.' }
            ].map((f, i) => (
              <div 
                key={i} 
                className={`feature-card glass-card tilt-card reveal slide-up delay-${i+1}`}
                onMouseMove={handleCardTilt}
                onMouseLeave={resetCardTilt}
              >
                <div className="feature-icon">
                  <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d={f.icon} strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </div>
                <h3 className="feature-name">{f.name}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo */}
        <section id="engine" className="demo-section">
          <div className="demo-container max-width reveal slide-up">
            <div className="demo-header">
              <h2 className="demo-title">Try the Engine</h2>
              <p className="demo-subtitle">Live computation demo</p>
            </div>
            <div className="demo-card glass-card">
              <div className="demo-controls">
                <div className="control-header">
                  <label>Market Volatility</label>
                  <span className="vol-val">{volatility}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" max="50" 
                  value={volatility} 
                  onChange={(e) => setVolatility(parseInt(e.target.value))}
                  className="vol-slider"
                />
              </div>
              <div className="chart-wrapper">
                <canvas ref={fanChartCanvasRef} />
              </div>
              <div className="demo-footer">
                <Link href="#" className="flex-center gap-2">
                  <span>Run 10,000 paths in the app</span> <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="pricing-section">
          <div className="pricing-container max-width">
            <div className="pricing-header reveal slide-up">
              <h2 className="section-title">Select Your Intelligence</h2>
              <div className="pricing-toggle-wrap">
                <span>Monthly</span>
                <button className={`toggle-btn ${isYearly ? 'yearly' : ''}`} onClick={() => setIsYearly(!isYearly)}>
                  <div className="toggle-dot"></div>
                </button>
                <span className="yearly-label">Yearly <span className="save-badge">(Save 20%)</span></span>
              </div>
            </div>
            
            <div className="pricing-grid">
              {[
                { name: 'Explorer', price: 'Free', tagline: '"Wow, this is eye-opening."', features: ['10 Simulation Runs / Mo', 'Basic Asset Classes', 'Standard Risk Metrics'], btn: 'Get Started' },
                { name: 'Academic', price: isYearly ? '$48' : '$5', tagline: '"Powerful learning."', features: ['Verified Student Only', '100 Simulations / Mo', 'Exportable Reports'], btn: 'Verify ID' },
                { name: 'Quantmind Pro', price: isYearly ? '$229' : '$24.99', tagline: '"A serious serious tool."', features: ['Unlimited Simulations', 'AI Portfolio Doctor (LLM)', 'Real-Time Volatility', 'API Access (Beta)'], btn: 'Go Pro Now', featured: true },
                { name: 'Investor', price: isYearly ? '$99' : '$9.99', tagline: '"Invest smarter."', features: ['500 Simulations / Mo', 'Full Asset Universe', 'Ad-Free Experience'], btn: 'Upgrade' }
              ].map((p, i) => (
                <div 
                  key={i} 
                  className={`price-card glass-card tilt-card reveal slide-up delay-${i+1} ${p.featured ? 'featured' : ''}`}
                  onMouseMove={handleCardTilt}
                  onMouseLeave={resetCardTilt}
                >
                  {p.featured && <div className="pro-badge shimmer">Pro Choice</div>}
                  <span className={`plan-name ${p.featured ? 'pro-label' : ''}`}>{p.name}</span>
                  <div className={`plan-price ${p.featured ? 'pro-val text-glow' : ''}`}>
                    {p.price}<span>/{isYearly ? 'yr' : 'mo'}</span>
                  </div>
                  <p className="plan-tagline">{p.tagline}</p>
                  <ul className="plan-features">
                    {p.features.map((f, j) => (
                      <li key={j} className={p.featured ? 'white' : ''}><CheckMark active={p.featured} /> {f}</li>
                    ))}
                  </ul>
                  <button className={`plan-btn ${p.featured ? 'pro-btn shimmer' : ''}`}>{p.btn}</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="main-footer">
        <div className="footer-container max-width reveal fade-in">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand mb-6">
                <div className="brand-logo small">
                  <div className="logo-inner"></div>
                </div>
                <span className="brand-name">QUANTMIND</span>
              </div>
              <p className="brand-text">
                The future of portfolio intelligence. We bring institutional-grade risk modeling to the modern investor.
              </p>
            </div>
            <div className="footer-col">
              <label>Product</label>
              <Link href="#">Risk Engine</Link>
              <Link href="#">Monte Carlo API</Link>
              <Link href="#">Documentation</Link>
            </div>
            <div className="footer-col">
              <label>Company</label>
              <Link href="#">About Us</Link>
              <Link href="#">Contact</Link>
              <Link href="#">Privacy</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="confidential-tag">March 2026 · Confidential · Built for Tomorrow</span>
            <div className="social-links">
              <Link href="#">Twitter</Link>
              <Link href="#">LinkedIn</Link>
              <Link href="#">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing-wrap {
          background-color: #080810;
          color: white;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
          position: relative;
        }

        .max-width {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Reveal Animations */
        .reveal {
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
          pointer-events: none;
        }
        .reveal.is-visible {
          opacity: 1;
          pointer-events: auto;
        }
        .reveal.slide-up { transform: translateY(40px); }
        .reveal.slide-up.is-visible { transform: translateY(0); }
        .reveal.fade-in.is-visible { opacity: 1; }

        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }

        /* Particles */
        .particle-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        /* Nav */
        .main-nav {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 80px;
          z-index: 100;
          background: rgba(8, 8, 16, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          background: #00F0FF;
          border-radius: 2px;
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
        }

        .logo-inner {
          width: 16px;
          height: 16px;
          background: #080810;
          border-radius: 1px;
        }

        .brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
        }

        .nav-links {
          display: none;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .nav-links { display: flex; }
        }

        .nav-links a {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9090B8;
          transition: all 0.2s;
        }

        .nav-links a:hover { color: #00F0FF; text-shadow: 0 0 8px rgba(0, 240, 255, 0.5); }

        .nav-cta {
          padding: 0.5rem 1.25rem;
          border: 1px solid rgba(0, 240, 255, 0.3);
          border-radius: 4px;
          color: #00F0FF;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: transparent;
          cursor: pointer;
        }

        /* Shimmer Effect */
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transform: rotate(45deg);
          animation: shimmer-anim 3s infinite;
          pointer-events: none;
        }
        @keyframes shimmer-anim {
          0% { transform: translate(-100%, -100%) rotate(45deg); }
          100% { transform: translate(100%, 100%) rotate(45deg); }
        }

        /* Hero */
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: 80px;
          overflow: hidden;
        }

        .perspective-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: 80px 80px;
          background-image: 
            linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
          transform: perspective(1000px) rotateX(60deg) translateY(-80px);
          z-index: 0;
          pointer-events: none;
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          z-index: 10;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .hero-container { grid-template-columns: 1.2fr 0.8fr; }
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3.5rem;
          font-weight: 600;
          color: #D4A017;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          transition: transform 0.3s;
        }
        .hero-title:hover { transform: scale(1.02); }

        @media (min-width: 768px) {
          .hero-title { font-size: 5rem; }
        }

        .hero-title-white { color: white; }

        .hero-lead {
          font-size: 1.25rem;
          color: #9090B8;
          max-width: 500px;
          margin-bottom: 2.5rem;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .btn-primary {
          padding: 1rem 2.5rem;
          background: linear-gradient(to right, #D4A017, #B8860B);
          color: #080810;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 4px;
          box-shadow: 0 4px 14px rgba(212, 160, 23, 0.4);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-primary:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 24px rgba(212, 160, 23, 0.5);
        }

        .btn-secondary {
          padding: 1rem 2.5rem;
          border: 1px solid #00F0FF;
          color: #00F0FF;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 4px;
          background: transparent;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-secondary:hover {
          background: rgba(0, 240, 255, 0.1);
          transform: translateY(-4px);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
        }

        .hero-visual {
          position: relative;
          display: flex;
          justify-content: center;
        }

        @media (min-width: 1024px) {
          .hero-visual { justify-content: flex-end; }
        }

        .visual-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 140%;
          height: 140%;
          background: radial-gradient(circle, rgba(0, 240, 255, 0.1) 0%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
        }

        .phone-mockup {
          position: relative;
          width: 300px;
          aspect-ratio: 9/19.5;
          background: #12121A;
          border-radius: 3rem;
          border: 8px solid #12121A;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          animation: float 8s ease-in-out infinite;
          cursor: crosshair;
        }

        .phone-mockup img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotateX(8deg) rotateY(-8deg); }
          50% { transform: translateY(-25px) rotateX(12deg) rotateY(-4deg); }
        }

        /* Stats */
        .stats-section {
          background: #12121A;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 4rem 0;
          z-index: 10;
          position: relative;
        }

        .stats-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          text-align: center;
        }

        @media (min-width: 768px) {
          .stats-container { grid-template-columns: repeat(3, 1fr); }
        }

        .stat-value {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 3rem;
          color: #00F0FF;
          font-weight: 500;
          text-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
        }

        .stat-label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #9090B8;
        }

        /* Features */
        .features-section {
          padding: 8rem 0;
          position: relative;
          z-index: 10;
        }

        .section-header {
          text-align: center;
          margin-bottom: 5rem;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
        }

        .title-underline {
          width: 100px;
          height: 4px;
          background: #00F0FF;
          margin: 0 auto;
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        @media (min-width: 768px) {
          .features-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .glass-card {
          background: rgba(18, 18, 26, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(144, 144, 184, 0.1);
          border-radius: 1.5rem;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        /* Tilt Effect */
        .tilt-card {
          transform: perspective(1000px) rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg)) scale3d(1, 1, 1);
          transform-style: preserve-3d;
        }
        .tilt-card:hover {
          border-color: rgba(0, 240, 255, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 240, 255, 0.1);
          z-index: 30;
        }

        .feature-card {
          padding: 3rem;
          position: relative;
          overflow: hidden;
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          color: #00F0FF;
          margin-bottom: 2rem;
          filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.4));
          transition: transform 0.4s;
        }
        .feature-card:hover .feature-icon { transform: translateZ(20px) scale(1.1); }

        .feature-name {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.25rem;
        }

        .feature-desc {
          color: #9090B8;
          line-height: 1.7;
          font-size: 1rem;
        }

        /* Demo */
        .demo-section {
          padding: 8rem 0;
          background: linear-gradient(to bottom, #080810, #0C0C14);
        }

        .demo-card {
          padding: 3rem;
          max-width: 900px;
          margin: 0 auto;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }

        .demo-header {
           text-align: center;
           margin-bottom: 4rem;
        }

        .demo-title { font-family: 'Cormorant Garamond', serif; font-size: 3rem; margin-bottom: 0.5rem; }
        .demo-subtitle {
           font-family: 'Space Grotesk', sans-serif;
           font-size: 0.875rem;
           text-transform: uppercase;
           letter-spacing: 0.2em;
           color: #00F0FF;
        }

        .demo-controls { margin-bottom: 3rem; }
        .control-header {
           display: flex;
           justify-content: space-between;
           margin-bottom: 1.25rem;
        }
        .control-header label {
           font-family: 'Space Grotesk', sans-serif;
           font-size: 0.875rem;
           text-transform: uppercase;
           letter-spacing: 0.1em;
           color: #9090B8;
        }
        .vol-val {
           font-family: 'JetBrains Mono', monospace;
           font-size: 1.25rem;
           color: #00F0FF;
        }

        .vol-slider {
           width: 100%;
           height: 4px;
           background: #202030;
           border-radius: 4px;
           appearance: none;
           cursor: pointer;
           accent-color: #00F0FF;
           outline: none;
        }

        .chart-wrapper {
           height: 300px;
           background: rgba(8, 8, 16, 0.6);
           border-radius: 1rem;
           border: 1px solid rgba(255, 255, 255, 0.05);
           overflow: hidden;
           margin-bottom: 2rem;
           box-shadow: inset 0 0 20px rgba(0,0,0,0.4);
        }

        .chart-wrapper canvas { width: 100%; height: 100%; }

        .demo-footer { text-align: center; }
        .flex-center { display: flex; align-items: center; justify-content: center; }
        .gap-2 { gap: 0.75rem; }
        
        .arrow { font-size: 1.25rem; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .demo-footer a:hover .arrow { transform: translateX(8px) scale(1.2); }
        .demo-footer a {
          color: #00F0FF;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          text-decoration: none;
          transition: all 0.3s;
        }
        .demo-footer a:hover { text-shadow: 0 0 10px rgba(0, 240, 255, 0.6); }

        /* Pricing */
        .pricing-section {
          padding: 8rem 0;
          position: relative;
          z-index: 10;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 6rem;
        }

        .pricing-toggle-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 3rem;
        }

        .pricing-toggle-wrap span {
           font-family: 'Space Grotesk', sans-serif;
           font-size: 0.875rem;
           text-transform: uppercase;
           letter-spacing: 0.15em;
           color: #9090B8;
        }

        .yearly-label { color: white !important; }
        .save-badge { color: #D4A017; font-weight: 700; }

        .toggle-btn {
          width: 56px;
          height: 28px;
          background: #12121A;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        .toggle-btn:hover { border-color: #00F0FF; }

        .toggle-dot {
          position: absolute;
          top: 3px;
          left: 4px;
          width: 20px;
          height: 20px;
          background: #00F0FF;
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
        }

        .toggle-btn.yearly .toggle-dot { transform: translateX(28px); }

        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: center;
        }

        @media (min-width: 768px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 1024px) {
          .pricing-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        }

        .price-card {
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
        }

        .price-card.featured {
          background: #12121A;
          border: none;
          transform: scale(1.08);
          z-index: 20;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 240, 255, 0.1);
        }

        /* Animated border logic */
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotate-angle { to { --angle: 360deg; } }

        .price-card.featured::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 1.5rem;
          padding: 1px;
          background: conic-gradient(from var(--angle), #00F0FF, transparent 40%, #00F0FF);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate-angle 4s linear infinite;
          pointer-events: none;
        }

        .pro-badge {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: #00F0FF;
          color: #080810;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .plan-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.25rem;
          color: #9090B8;
          margin-bottom: 0.75rem;
        }
        .pro-label { color: #00F0FF; text-shadow: 0 0 10px rgba(0, 240, 255, 0.4); }

        .plan-price { font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; margin-bottom: 0.75rem; }
        .pro-val { font-size: 3rem; }
        .text-glow { color: white; text-shadow: 0 0 20px rgba(255,255,255,0.2); }
        .plan-price span { font-size: 1.125rem; color: #9090B8; font-family: 'DM Sans', sans-serif; margin-left: 0.25rem; }

        .plan-tagline { font-style: italic; color: #9090B8; font-size: 0.875rem; margin-bottom: 2.5rem; color: #9090B8; }

        .plan-features { list-style: none; padding: 0; margin: 0 0 2.5rem 0; flex-grow: 1; }
        .plan-features li { display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.9375rem; color: #9090B8; margin-bottom: 1.25rem; }
        .plan-features li.white { color: white; font-weight: 500; }

        .plan-btn {
          width: 100%;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: white;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }
        .plan-btn:hover { background: rgba(255, 255, 255, 0.05); transform: translateY(-2px); border-color: white; }

        .pro-btn {
          background: #00F0FF;
          color: #080810;
          border: none;
          box-shadow: 0 10px 20px rgba(0, 240, 255, 0.3);
        }
        .pro-btn:hover { 
          background: white; 
          transform: translateY(-4px) scale(1.02); 
          box-shadow: 0 15px 30px rgba(0, 240, 255, 0.4); 
        }

        /* Footer */
        .main-footer {
          padding: 8rem 0 4rem;
          background: #080810;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          z-index: 10;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4rem;
          margin-bottom: 6rem;
        }

        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 2fr 1fr 1fr; }
        }

        .brand-text { color: #9090B8; max-width: 24rem; line-height: 1.7; font-size: 1rem; }

        .footer-col { display: flex; flex-direction: column; gap: 1.25rem; }
        .footer-col label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: white;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }
        .footer-col a { color: #9090B8; font-size: 0.9375rem; transition: all 0.2s; }
        .footer-col a:hover { color: #00F0FF; transform: translateX(5px); }

        .footer-bottom {
          padding-top: 3rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
        }

        @media (min-width: 768px) {
          .footer-bottom { flex-direction: row; justify-content: space-between; }
        }

        .confidential-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .social-links { display: flex; gap: 2rem; }
        .social-links a { font-size: 0.9375rem; color: #9090B8; transition: all 0.2s; }
        .social-links a:hover { color: #00F0FF; transform: scale(1.1); }

        .mb-6 { margin-bottom: 2rem; }
      `}</style>
    </div>
  );
}

function CheckMark({ active }: { active?: boolean }) {
  return (
    <svg className={`w-4 h-4 shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', color: active ? '#00F0FF' : '#9090B8' }}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
    </svg>
  );
}
