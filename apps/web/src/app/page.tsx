'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Cpu, X, Smartphone, Apple, ArrowUp, ArrowRight, Shield, Play } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DownloadModal } from '@/components/ui/DownloadModal';
import { createClient } from '@/lib/supabase';


export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false);
  const [volatility, setVolatility] = useState(15);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveSymbol] = useState('BTC/USD');
  const [mounted, setMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const supabase = createClient();

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

  // Mounting detection for hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Back to Top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Fetch Initial Live Data
  useEffect(() => {
    const fetchPrice = async () => {
      const { data, error } = await supabase
        .from('prices')
        .select('price')
        .eq('symbol', liveSymbol)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (data) setLivePrice(Number(data.price));
    };

    fetchPrice();

    // Subscribe to Realtime Updates
    const channel = supabase
      .channel('live-prices')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'prices',
        filter: `symbol=eq.${liveSymbol}`
      }, (payload) => {
        if (payload.new && payload.new.price) {
          setLivePrice(Number(payload.new.price));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [liveSymbol]);

  // Fan Chart Logic
  useEffect(() => {
    const canvas = fanChartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animateFanChart = () => {
      const container = canvas.parentElement;
      if (!container) return;

      let animationId: number;
      let frame = 0;

      const draw = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const centerY = h / 2;
        const steps = 60;
        const paths = 40;

        ctx.clearRect(0, 0, w, h);
        frame += 0.015;

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += w / 10) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        }

        // Fan Paths
        for (let i = 0; i < paths; i++) {
          ctx.beginPath();
          ctx.moveTo(0, centerY);

          const opacity = (1 - Math.abs(i - paths / 2) / (paths / 2)) * 0.3;
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;

          for (let j = 1; j <= steps; j++) {
            const x = (j / steps) * w;
            const drift = (j / steps) * -20;
            const spread = (volatility / 50) * (j / steps) * 80;

            // Deterministic but time-varying noise
            const tOffset = Math.sin(frame + i * 0.7 + j * 0.1) * 1.5;
            const spreadFactor = volatility / 50;
            const driftRange = (livePrice || 100) * 0.05; // 5% drift range
            const staticNoise = (Math.sin(i * 13.5 + j * 7.2) * 0.5) * spreadFactor * 80;

            const currentY = centerY + drift + (staticNoise + tOffset) * (i - paths / 2) * 0.15;
            ctx.lineTo(x, currentY);
          }
          ctx.stroke();
        }

        // Median Line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.strokeStyle = 'rgba(0, 240, 255, 1)';
        ctx.lineWidth = 2;
        for (let j = 1; j <= steps; j++) {
          const x = (j / steps) * w;
          const drift = (j / steps) * -20;
          ctx.lineTo(x, centerY + drift + Math.sin(frame * 1.5 + j * 0.1) * 2);
        }
        ctx.stroke();

        animationId = requestAnimationFrame(draw);
      };

      draw();
      return () => cancelAnimationFrame(animationId);
    };

    const cleanup = animateFanChart();
    return () => {
      if (cleanup) cleanup();
    };
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
            <div className="brand-logo-container">
              <img src="/logo.png" alt="QuantMind Logo" className="brand-logo-img" />
            </div>
            <span className="brand-name">QUANTMIND</span>
          </div>
          <div className="nav-links">
            <Link href="#features" className="nav-link-item">Intelligence</Link>
            <Link href="#engine" className="nav-link-item">The Engine</Link>
            <Link href="#pricing" className="nav-link-item">Pricing</Link>
            <Link href="#about" className="nav-link-item">About</Link>
            <Link href="#contact" className="nav-link-item">Contact</Link>
          </div>
          <Link href="/auth/login" className="nav-cta shimmer">Client Login</Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="perspective-grid"></div>
          <div className="hero-container max-width reveal slide-up">
            <div className="hero-content">
              <h1 className="hero-title">
                Invest with foresight.<br />
                <span className="hero-title-white">Not just hindsight.</span>
              </h1>
              <p className="hero-lead">
                QuantMind delivers professional-grade portfolio risk intelligence, bridging the gap between retail accessibility and institutional sophistication. Our advanced Monte Carlo engine runs 10,000 parallel market realities to stress-test your strategy against historical and synthetic market stressors.
              </p>
              <div className="hero-buttons">
                <button
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="btn-primary shimmer"
                >
                  Download App
                  <ArrowRight size={18} />
                </button>
                <Link href="/auth/signup" className="btn-secondary">
                  <Shield size={18} />
                  <span>Create Vault</span>
                </Link>
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
            {[
              { val: '$1.2B', label: 'Assets Modeled', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
              { val: '450K', label: 'Simulations', icon: 'M9.75 17L9 20l-1.5-4h3L9.75 17z' },
              { val: '4.9', label: 'App Rating', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' }
            ].map((stat, i) => (
              <div
                key={i}
                className={`stat-card group glass-card tilt-card reveal slide-up delay-${i + 1}`}
                onMouseMove={handleCardTilt}
                onMouseLeave={resetCardTilt}
              >
                <div className="stat-glow"></div>
                <div className="stat-content text-center">
                  <span className="block font-mono text-4xl md:text-5xl font-bold tracking-tighter text-white mb-2 transition-all duration-400 group-hover:text-cyan-400 group-hover:scale-110">
                    {stat.val}
                  </span>
                  <span className="font-space text-xs md:text-sm uppercase tracking-[0.2em] text-[#848D97] font-bold transition-all duration-400 group-hover:text-white group-hover:tracking-[0.3em]">
                    {stat.label}
                  </span>
                </div>
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
                className={`feature-card glass-card tilt-card reveal slide-up delay-${i + 1}`}
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
                <div className="chart-overlay">
                  <div className="stat-row">
                    <span className="stat-label">LIVE_ASSET</span>
                    <span className="stat-value text-cyan">{liveSymbol} @ ${livePrice?.toLocaleString() ?? 'FETCHING...'}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">DAILY_VAR_99%</span>
                    <span className="stat-value text-red">
                      -${((livePrice ?? 1000) * (volatility / 1000) * 2.33).toFixed(2)}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">MONTE_CARLO_PATHS</span>
                    <span className="stat-value">10,000</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">NODE_LATENCY</span>
                    <span className="stat-value text-green">12ms</span>
                  </div>
                </div>
                <div className="chart-timestamp">
                  GLOBAL_SYNC_ACTIVE // {mounted ? new Date().toLocaleTimeString() : 'INITIALIZING_STREAM...'}
                </div>
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
                <span className="yearly-label">Yearly <span className="save-badge">(Save up to 23%)</span></span>
              </div>
            </div>

            <div className="pricing-grid">
              {[
                { name: 'Free — Explorer', price: '$0', kesPrice: 'KES 0', tagline: '"Wow, this is eye-opening."', features: ['2 Institutional Portfolios', '2,000 Simulation Paths', 'Basic Risk Metrics'], btn: 'Get Started' },
                { name: 'Plus — Investor', price: isYearly ? '$99' : '$9.99', kesPrice: isYearly ? 'KES 14,850' : 'KES 1,499', tagline: '"Invest smarter. institutional data for all."', features: ['Unlimited Portfolios', '10,000 Sim Paths', 'Diversification Score', 'Standard AI Access'], btn: 'Upgrade', save: '17.5% OFF' },
                { name: 'Quantmind Pro', price: isYearly ? '$229' : '$24.99', kesPrice: isYearly ? 'KES 34,350' : 'KES 3,749', tagline: '"A serious serious tool for the heavy hitters."', features: ['Unlimited Portfolios', '10,000+ Sim Paths', 'AI Portfolio Doctor (LLM)', 'Fat-Tail (Levy) Engines'], btn: 'Go Pro Now', featured: true, save: '23.6% OFF' },
                { name: 'Student / Academic', price: isYearly ? '$49' : '$5', kesPrice: isYearly ? 'KES 7,350' : 'KES 750', tagline: '"Powerful learning. Restricted access."', features: ['Verified Student Only', '10,000 Sim Paths / Mo', 'Exportable Reports', 'Same as Plus tier'], btn: 'Verify ID', comingSoon: true, save: '18.3% OFF' }
              ].map((p, i) => (
                <div
                  key={i}
                  className={`price-card glass-card tilt-card reveal slide-up delay-${i + 1} ${p.featured ? 'featured' : ''} ${p.comingSoon ? 'disabled-tier' : ''}`}
                  onMouseMove={p.comingSoon ? undefined : handleCardTilt}
                  onMouseLeave={p.comingSoon ? undefined : resetCardTilt}
                >
                  {p.featured && <div className="pro-badge shimmer">Pro Choice</div>}
                  {isYearly && p.save && <div className="save-corner-badge">{p.save}</div>}
                  <span className={`plan-name ${p.featured ? 'pro-label' : ''}`}>{p.name}</span>
                  <div className={`plan-price ${p.featured ? 'pro-val text-glow' : ''}`}>
                    {p.price}<span>/{isYearly ? 'yr' : 'mo'}</span>
                  </div>
                  {p.kesPrice && (
                    <div className="plan-kes-price">{p.kesPrice}</div>
                  )}
                  <p className="plan-tagline">{p.tagline}</p>
                  <ul className="plan-features">
                    {p.features.map((f, j) => (
                      <li key={j} className={p.featured ? 'white' : ''}><CheckMark active={p.featured} /> {f}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      if (p.comingSoon) return;
                      // Determine target based on plan
                      const planSlug = p.name.toLowerCase().includes('plus') ? 'plus' :
                        p.name.toLowerCase().includes('pro') ? 'pro' : 'free';

                      // Synchronize billing context for institutional-grade onboarding
                      window.location.href = `/auth/signup?plan=${planSlug}&billing=${isYearly ? 'yearly' : 'monthly'}`;
                    }}
                    className={`plan-btn ${p.featured ? 'pro-btn shimmer' : ''} ${p.comingSoon ? 'disabled-btn' : ''}`}
                  >
                    {p.comingSoon ? 'COMING_SOON' : p.btn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about-section">
          <div className="about-container max-width reveal slide-up">
            <div className="about-layout">
              <div className="about-content">
                <div className="about-header">
                  <span className="about-tag">SINCE_2008</span>
                  <h2 className="about-title">Institutional Roots</h2>
                  <div className="about-divider"></div>
                </div>

                <div className="about-text-wrap">
                  <p className="about-text">
                    Born from the high-frequency trading floors of London and New York, QuantMind was built to bridge the gap between retail accessibility and institutional sophistication.
                  </p>
                  <p className="about-text">
                    Our mission is simple: to provide every investor with the same predictive foresight used by the world's most successful hedge funds. No more guessing; only data-driven strategy.
                  </p>
                </div>

                <div className="about-features-row">
                  {['HFT-Grade Data', 'Monte Carlo Standard', 'Neural Risk Modeling'].map((f, i) => (
                    <div key={i} className="about-f-item">
                      <div className="f-icon-wrap"><CheckCircle2 size={14} /></div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="about-visual-side">
                <div
                  className="visual-card-wrap tilt-card"
                  onMouseMove={handleCardTilt}
                  onMouseLeave={resetCardTilt}
                >
                  <GlassCard className="visual-card" intensity="medium">
                    <div className="card-glitch-layer"></div>
                    <div className="card-content">
                      <div className="node-status">
                        <div className="status-dot animate-pulse"></div>
                        <span>SYSTEM_STABLE</span>
                      </div>
                      <Cpu size={64} className="node-icon" />
                      <div className="node-info">
                        <span className="node-label">Quant_Core_v4.2</span>
                        <h4 className="node-name">Active_Sovereign_Control</h4>
                      </div>
                      <div className="node-stats-grid">
                        <div className="n-stat">
                          <span className="n-val">2.4ms</span>
                          <span className="n-lab">LATENCY</span>
                        </div>
                        <div className="n-stat">
                          <span className="n-val">99.9%</span>
                          <span className="n-lab">UPTIME</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                  <div className="card-shadow-bg"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact-section">
          <div className="contact-container max-width reveal slide-up">
            <div className="section-header">
              <h2 className="section-title">Establish Connectivity</h2>
              <div className="title-underline"></div>
            </div>
            <div className="contact-grid">
              <GlassCard className="contact-form-card" intensity="medium">
                <div className="form-fields">
                  <div className="form-group">
                    <label className="form-label">Institutional_Identifier</label>
                    <input type="text" placeholder="FullName / CorporateName" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Direct_Relay_Address</label>
                    <input type="email" placeholder="contact@institution.com" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Inquiry_Payload</label>
                    <textarea rows={4} placeholder="Protocol requirement details..." className="form-textarea" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const btn = document.activeElement as HTMLButtonElement;
                    if (btn) {
                      const originalText = btn.innerText;
                      btn.innerText = "TRANSMITTING...";
                      btn.disabled = true;
                      setTimeout(() => {
                        alert("PROTOCOL SYNCHRONIZED: Inquiry Payload Transmitted to QuantMind Central Control.");
                        btn.innerText = originalText;
                        btn.disabled = false;
                      }, 1500);
                    }
                  }}
                  className="btn-primary form-submit shimmer"
                >
                  Transmit_Data
                </button>
              </GlassCard>

              <div className="contact-info-side">
                <div className="info-block">
                  <h3 className="info-title">Global_Access_Nodes</h3>
                  <div className="info-list">
                    <p className="info-item">NY::Wall_Street_v1</p>
                    <p className="info-item">LDN::Canary_Wharf_v3</p>
                    <p className="info-item">LAG::Victoria_Island_v5</p>
                  </div>
                </div>
                <div className="info-block">
                  <h3 className="info-title">Direct_Communications</h3>
                  <div className="info-list">
                    <p className="info-item highlight">shadracking7@gmail.com</p>
                    <p className="info-item highlight">+254746741690</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="main-footer">
        <div className="footer-container max-width reveal fade-in">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand mb-6">
                <div className="brand-logo-container small">
                  <img src="/logo.png" alt="QuantMind Logo" className="brand-logo-img" />
                </div>
                <span className="brand-name">QUANTMIND</span>
              </div>
              <p className="brand-text">
                The future of portfolio intelligence. We bring institutional-grade risk modeling to the modern investor.
              </p>
            </div>
            <div className="footer-col">
              <label>Product</label>
              <Link href="#engine">Risk Engine</Link>
              <Link href="#features">Monte Carlo API</Link>
              {mounted ? (
                <Link href="/docs">Documentation</Link>
              ) : (
                <div style={{ visibility: 'hidden', height: '1.25rem' }}>Documentation</div>
              )}
            </div>
            <div className="footer-col">
              <label>Company</label>
              <Link href="#about">About Us</Link>
              <Link href="mailto:shadracking7@gmail.com">Contact</Link>
              <Link href="/legal/privacy">Privacy Policy</Link>
              <Link href="/legal/terms">Terms of Service</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="confidential-tag">March 2026 · Confidential · Built for Tomorrow</span>
            <div className="social-links">
              <Link href="https://twitter.com/quantmind" target="_blank">Twitter</Link>
              <Link href="https://linkedin.com/company/quantmind" target="_blank">LinkedIn</Link>
              <Link href="https://github.com/quantmind" target="_blank">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      <style jsx>{`
        .landing-wrap {
          background-color: #080810;
          color: white;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
          position: relative;
          scroll-behavior: smooth;
        }

        .flex-center { display: flex; align-items: center; justify-content: center; }

        .about-section, .contact-section {
           padding: 100px 0;
           position: relative;
           z-index: 10;
        }

        .about-layout {
           display: grid;
           grid-template-columns: 1fr;
           gap: 4rem;
           align-items: center;
        }
        @media (min-width: 1024px) {
           .about-layout { grid-template-columns: 1.2fr 0.8fr; }
        }

        .about-header {
          margin-bottom: 2.5rem;
        }

        .about-tag {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          color: #00F0FF;
          letter-spacing: 0.3em;
          display: block;
          margin-bottom: 0.5rem;
        }

        .about-title {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          color: white;
          margin-bottom: 1rem;
        }

        .about-divider {
          width: 60px;
          height: 4px;
          background: linear-gradient(90deg, #00F0FF, transparent);
          border-radius: 2px;
        }

        .about-text-wrap {
          max-width: 600px;
        }

        .about-text {
           color: #9090B8;
           font-size: 1.125rem;
           line-height: 1.8;
           margin-bottom: 1.5rem;
        }

        .about-features-row {
           display: flex;
           flex-wrap: wrap;
           gap: 2rem;
           margin-top: 3rem;
           padding-top: 2rem;
           border-top: 1px solid rgba(255,255,255,0.05);
        }

        .about-f-item {
           display: flex;
           align-items: center;
           gap: 0.75rem;
           color: white;
           font-size: 0.75rem;
           font-weight: 700;
           text-transform: uppercase;
           letter-spacing: 0.15em;
        }

        .f-icon-wrap {
          width: 24px;
          height: 24px;
          background: rgba(0, 240, 255, 0.1);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00F0FF;
        }

        /* Visual Side */
        .about-visual-side {
          position: relative;
          display: flex;
          justify-content: center;
        }

        .visual-card-wrap {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 2;
        }

        :global(.visual-card) {
          padding: 2.5rem !important;
          border: 1px solid rgba(0, 240, 255, 0.2) !important;
          border-radius: 24px !important;
          position: relative;
          overflow: hidden;
        }

        .card-glitch-layer {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,240,255,0.05) 0%, transparent 100%);
          opacity: 0.5;
        }

        .node-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #32D74B;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(50, 215, 75, 0.5);
        }

        .node-status span {
          font-size: 0.65rem;
          font-weight: 800;
          color: #32D74B;
          letter-spacing: 0.1em;
        }

        :global(.node-icon) {
          color: #00F0FF !important;
          margin-bottom: 2rem;
          filter: drop-shadow(0 0 15px rgba(0,240,255,0.4));
        }

        .node-info {
          margin-bottom: 2.5rem;
        }

        .node-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #848D97;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.5rem;
        }

        .node-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: 'Space Grotesk', sans-serif;
        }

        .node-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .n-stat {
          display: flex;
          flex-direction: column;
        }

        .n-val {
          font-size: 1rem;
          font-weight: 800;
          color: white;
          font-family: 'Space Grotesk', sans-serif;
        }

        .n-lab {
          font-size: 0.6rem;
          font-weight: 700;
          color: #848D97;
          letter-spacing: 0.1em;
        }

        .card-shadow-bg {
          position: absolute;
          top: 20px;
          left: 20px;
          width: 100%;
          height: 100%;
          background: rgba(0, 240, 255, 0.03);
          border-radius: 24px;
          z-index: -1;
          filter: blur(20px);
        }

        .max-width {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Reveal Animations */
        .reveal {
          opacity: 1; /* Default to visible to prevent 'disappearing' bug */
          transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1.01);
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
        /* Futuristic Nav Overhaul - Global Support */
        :global(.main-nav) {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 48px);
          max-width: 1200px;
          height: 60px;
          z-index: 1000;
          background: rgba(8, 8, 16, 0.45) !important;
          backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 100px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 240, 255, 0.05);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        :global(.main-nav:hover) {
          border-color: rgba(0, 240, 255, 0.4);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 240, 255, 0.15);
          background: rgba(8, 8, 16, 0.6) !important;
        }

        :global(.nav-container) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 100%;
        }

        :global(.brand) {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0.5rem 1rem;
          border-radius: 100px;
        }
        :global(.brand:hover) { 
          transform: none;
          background: transparent; 
        }

        :global(.brand-logo-container) {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
        }
        :global(.brand:hover .brand-logo-container) {
          transform: none;
        }

        :global(.brand-logo-img) {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        :global(.brand-name) {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: 0.05em;
          color: white;
          transition: none;
        }
        :global(.brand:hover .brand-name) {
          letter-spacing: 0.05em;
          text-shadow: none;
        }

        :global(.nav-links) {
          display: none;
          gap: 2.5rem; /* Massive improvement in spacing */
          background: rgba(255, 255, 255, 0.03);
          padding: 0.4rem 1.5rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }

        :global(.nav-links:hover) {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        @media (min-width: 1000px) {
          :global(.nav-links) { display: flex; }
        }

        :global(.nav-link-item) {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
          text-decoration: none;
          font-weight: 700;
          position: relative;
          padding: 0.25rem 0;
        }

        :global(.nav-link-item:hover) {
          color: #00F0FF;
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
        }
        
        :global(.nav-link-item::after) {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #00F0FF;
          border-radius: 2px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px #00F0FF;
        }
        :global(.nav-link-item:hover::after) {
          width: 100%;
        }

        :global(.nav-cta) {
          padding: 0.6rem 1.8rem;
          background: #00F0FF !important; /* Force the cyan background */
          color: #080810 !important;
          border-radius: 100px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);
          animation: cta-pulse 3s infinite;
          text-decoration: none;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes cta-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.3); }
          50% { box-shadow: 0 0 35px rgba(0, 240, 255, 0.7); }
        }

        :global(.nav-cta:hover) {
          background: white !important;
          color: #000 !important;
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 15px 45px rgba(0, 240, 255, 0.6);
          letter-spacing: 0.15em;
        }

        :global(.nav-cta:active) {
          transform: translateY(-1px) scale(0.98);
        }

        .nav-cta {
          padding: 0.75rem 1.75rem;
          background: #00F0FF;
          color: #080810;
          border-radius: 100px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
          animation: cta-pulse 3s infinite;
          text-decoration: none;
          border: none;
        }

        @keyframes cta-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.3); }
          50% { box-shadow: 0 0 35px rgba(0, 240, 255, 0.6); }
        }

        .nav-cta:hover {
          background: white;
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 15px 40px rgba(0, 240, 255, 0.5);
          animation: none;
        }

        .nav-cta:active {
          transform: translateY(-1px) scale(0.98);
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
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          text-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .hero-title:hover {
          transform: scale(1.02);
          text-shadow: 0 0 30px rgba(0, 240, 255, 0.2), 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        @media (min-width: 768px) {
          .hero-title { font-size: 5rem; }
        }

        .hero-title-white { color: white; }

        .hero-lead {
          font-size: 1.125rem;
          color: #9090B8;
          max-width: 650px;
          margin-bottom: 2.5rem;
          line-height: 1.8;
          text-align: left;
        }

        :global(.hero-buttons) {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 2rem 3rem !important; /* Increased horizontal gap to 3rem (48px) */
          margin-top: 4rem !important;
          justify-content: flex-start !important;
          align-items: center !important;
        }

        :global(.btn-link-wrap) {
          grid-column: span 2;
          display: flex !important;
          justify-content: center !important;
          width: 100% !important;
          margin-top: 1.5rem !important;
        }

        :global(.btn-primary) {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.85rem !important;
          padding: 1.1rem 2.8rem !important;
          background: #00F0FF !important;
          color: #080810 !important;
          border-radius: 100px !important;
          font-family: 'Space Grotesk', sans-serif !important;
          font-size: 0.85rem !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          border: none !important;
          cursor: pointer !important;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          box-shadow: 0 10px 40px rgba(0, 240, 255, 0.4) !important;
          white-space: nowrap !important;
          text-decoration: none !important;
        }

        :global(.btn-primary:hover) {
          background: white !important;
          transform: translateY(-5px) scale(1.05) !important;
          box-shadow: 0 20px 60px rgba(0, 240, 255, 0.6) !important;
          letter-spacing: 0.2em !important;
        }

        :global(.btn-secondary) {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 1rem !important; /* Increased gap from 0.85rem */
          padding: 1.1rem 3.2rem !important; /* Slightly wider */
          background: rgba(0, 217, 255, 0.03) !important; /* Hint of brand color */
          color: white !important;
          border-radius: 100px !important;
          font-family: 'Space Grotesk', sans-serif !important;
          font-size: 0.85rem !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.18em !important; /* Increased tracking */
          border: 1px solid rgba(0, 217, 255, 0.3) !important; /* Brand border */
          cursor: pointer !important;
          transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1) !important;
          backdrop-filter: blur(12px) !important;
          white-space: nowrap !important;
          text-decoration: none !important;
          min-width: max-content !important;
          position: relative;
        }

        :global(.btn-secondary span) {
          position: relative;
          top: 1px; /* Optical alignment for Space Grotesk */
        }

        :global(.btn-secondary:hover) {
          background: rgba(0, 240, 255, 0.1) !important;
          border-color: #00F0FF !important;
          transform: translateY(-5px) !important;
          box-shadow: 0 15px 40px rgba(0, 240, 255, 0.2) !important;
          letter-spacing: 0.2em !important;
          color: #00F0FF !important;
        }

        :global(.btn-link) {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          padding: 0.8rem 2rem !important;
          color: #848D97 !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.2em !important;
          font-family: 'Space Grotesk', sans-serif !important;
          font-size: 0.7rem !important;
          cursor: pointer !important;
          transition: all 0.4s ease !important;
          white-space: nowrap !important;
          border-radius: 100px !important;
          border: 1px solid transparent !important;
          background: transparent !important;
          text-decoration: none !important;
        }

        :global(.btn-link:hover) {
          color: white !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2) !important;
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
          background: #080810;
          padding: 6rem 0;
          position: relative;
          z-index: 10;
          overflow: hidden;
        }

        .stats-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          text-align: center;
        }

        @media (min-width: 768px) {
          .stats-container { grid-template-columns: repeat(3, 1fr); }
        }

        .stat-card {
          padding: 3rem 2rem;
          position: relative;
          overflow: hidden;
          background: rgba(18, 18, 26, 0.4);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 2rem;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .stat-card:hover {
          background: rgba(18, 18, 26, 0.8);
          border-color: rgba(0, 240, 255, 0.4);
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 240, 255, 0.1);
        }

        .stat-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%);
          filter: blur(40px);
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }

        .stat-card:hover .stat-glow {
          opacity: 1;
        }

        .stat-content {
          position: relative;
          z-index: 1;
        }

        /* Stats handled via globals.css */


        /* Stats handled via Tailwind group-hover */


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
           height: 380px;
           background: rgba(8, 8, 16, 0.6);
           border-radius: 1.5rem;
           border: 1px solid rgba(0, 240, 255, 0.15);
           overflow: hidden;
           margin-bottom: 2rem;
           box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.6);
           position: relative;
        }

        .chart-overlay {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          pointer-events: none;
        }

        .stat-row {
          display: flex;
          flex-direction: column;
        }

        .chart-overlay .stat-label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.6rem;
          font-weight: 800;
          color: rgba(144, 144, 184, 0.6);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .chart-overlay .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
        }

        .text-cyan { color: #00F0FF; text-shadow: 0 0 10px rgba(0, 240, 255, 0.4); }
        .text-green { color: #32D74B; text-shadow: 0 0 10px rgba(50, 215, 75, 0.4); }
        .text-red { color: #FF453A; text-shadow: 0 0 10px rgba(255, 69, 58, 0.4); }

        .chart-timestamp {
          position: absolute;
          bottom: 1rem;
          right: 1.5rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          color: rgba(144, 144, 184, 0.4);
          letter-spacing: 0.1em;
          pointer-events: none;
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
          align-items: stretch !important;
          margin-top: 5rem;
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
          z-index: 20;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 240, 255, 0.1);
          transform: none !important;
          margin-top: 0 !important;
          top: 0 !important;
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
          z-index: 10;
        }

        .save-corner-badge {
          position: absolute;
          top: 1.25rem;
          left: 1.25rem;
          background: #D4A017;
          color: #080810;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          box-shadow: 0 0 15px rgba(212, 160, 23, 0.4);
          z-index: 10;
          letter-spacing: 0.05em;
        }

        .plan-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.25rem;
          color: #9090B8;
          margin-bottom: 0.75rem;
        }
        .pro-label { color: #00F0FF; text-shadow: 0 0 10px rgba(0, 240, 255, 0.4); }

        .plan-price { 
          font-family: 'Cormorant Garamond', serif; 
          font-size: 2.5rem; 
          margin-bottom: 0.75rem; 
          min-height: 4.5rem;
          display: flex;
          align-items: baseline;
        }
        .pro-val { font-size: 3rem; }
        .text-glow { color: white; text-shadow: 0 0 20px rgba(255,255,255,0.2); }
        .plan-price span { font-size: 1.125rem; color: #9090B8; font-family: 'DM Sans', sans-serif; margin-left: 0.25rem; }

        .plan-kes-price { 
          font-family: 'DM Sans', sans-serif; 
          font-size: 0.75rem; 
          color: #848D97; 
          margin-bottom: 0.75rem; 
        }

        .plan-tagline { 
          font-style: italic; 
          color: #9090B8; 
          font-size: 0.95rem; 
          margin-bottom: 2.5rem; 
          min-height: 3rem;
          display: flex;
          align-items: center;
        }

        .plan-features { list-style: none; padding: 0; margin: 0 0 2.5rem 0; flex-grow: 1; min-height: 12rem; }
        .plan-features li { display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.9375rem; color: #9090B8; margin-bottom: 1.25rem; }
        .plan-features li.white { color: white; font-weight: 500; }

        .plan-btn {
          width: 100%;
          padding: 1.2rem;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          color: white;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .plan-btn:hover { 
          background: rgba(0, 240, 255, 0.1); 
          color: #00F0FF;
          transform: translateY(-5px); 
          border-color: #00F0FF;
          box-shadow: 0 10px 30px rgba(0, 240, 255, 0.15);
        }

        .pro-btn {
          background: #00F0FF;
          color: #080810;
          border: none;
          box-shadow: 0 10px 30px rgba(0, 240, 255, 0.4);
        }
        .pro-btn:hover { 
          background: white; 
          transform: translateY(-6px) scale(1.03); 
          box-shadow: 0 20px 50px rgba(0, 240, 255, 0.5); 
          letter-spacing: 0.25em;
        }

        .price-card.disabled-tier {
          opacity: 0.6;
          filter: saturate(0.2);
          pointer-events: none;
          cursor: not-allowed;
          border-color: rgba(255, 255, 255, 0.05) !important;
          background: rgba(255, 255, 255, 0.02) !important;
        }

        .disabled-btn {
          opacity: 0.5;
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #9090B8 !important;
          cursor: not-allowed;
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
        .footer-col a { 
          color: #9090B8; 
          font-size: 0.9375rem; 
          transition: all 0.2s; 
          text-decoration: none;
          display: block;
        }
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
        .social-links a { 
          font-size: 0.8rem; 
          color: #9090B8; 
          transition: all 0.2s; 
          text-decoration: none;
          font-family: 'Space Grotesk', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .social-links a:hover { color: #00F0FF; transform: scale(1.1); }

        /* Contact Section */
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .contact-grid { grid-template-columns: 1.2fr 0.8fr; }
        }

        :global(.contact-form-card) {
          padding: 3rem !important;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .form-label {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          color: #848D97;
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        .form-input, .form-textarea {
          width: 100%;
          background: #12121A;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          color: white;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          transition: all 0.3s;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: rgba(0, 240, 255, 0.5);
          background: #161622;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);
        }

        .form-submit {
          width: 100%;
          padding: 1.25rem !important;
          font-size: 0.75rem !important;
        }

        /* Info Side */
        .contact-info-side {
          display: flex;
          flex-direction: column;
          gap: 3rem;
          justify-content: center;
        }

        .info-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-item {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #848D97;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .info-item.highlight {
          color: #00F0FF;
          font-weight: 600;
          text-transform: none;
        }

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
