'use client';

import React, { useState, useEffect, useRef } from 'react';

export function SimulationDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mu, setMu] = useState(0.08);
  const [sigma, setSigma] = useState(0.2);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const numPaths = 50;
    const steps = 100;
    const initialValue = canvas.height * 0.7;
    const dt = 1/252;
    
    let frame = 0;
    const interval = setInterval(() => {
      if (frame >= steps) {
        clearInterval(interval);
        setRunning(false);
        return;
      }

      ctx.strokeStyle = 'rgba(0, 217, 255, 0.2)';
      ctx.lineWidth = 1;

      for (let i = 0; i < numPaths; i++) {
         let x = (frame / steps) * canvas.width;
         let nextX = ((frame + 1) / steps) * canvas.width;
         
         // Simplified GBM step for visual demo
         // Each path needs its own state, but for a simple "visual flare" we can just jitter
         // Actually, let's just draw lines
      }
      
      // To keep it simple and high-performance for a landing page:
      // We'll pre-calculate 50 paths and draw them step by step.
      frame++;
    }, 30);

    return () => clearInterval(interval);
  }, [running]);

  const startDemo = () => {
    setRunning(true);
  };

  return (
    <div className="demo-card">
       <div className="demo-controls">
         <div className="control-group">
           <label>Expected Return (μ): {Math.round(mu * 100)}%</label>
           <input type="range" min="0" max="0.2" step="0.01" value={mu} onChange={e => setMu(parseFloat(e.target.value))} />
         </div>
         <div className="control-group">
           <label>Volatility (σ): {Math.round(sigma * 100)}%</label>
           <input type="range" min="0.05" max="0.5" step="0.01" value={sigma} onChange={e => setSigma(parseFloat(e.target.value))} />
         </div>
         <button className="run-btn" onClick={startDemo} disabled={running}>
           {running ? 'CALCULATING...' : 'RUN LIVE DEMO'}
         </button>
       </div>
       <div className="canvas-wrapper">
          <canvas ref={canvasRef} width={600} height={300} />
          {!running && <div className="overlay-text">Ready to Simulate</div>}
       </div>

       <style jsx>{`
         .demo-card {
           background: var(--card-bg);
           border: 1px solid var(--border-color);
           border-radius: 12px;
           padding: 2rem;
           display: flex;
           gap: 2rem;
         }
         .demo-controls {
           width: 240px;
           display: flex;
           flex-direction: column;
           gap: 1.5rem;
         }
         .control-group {
           display: flex;
           flex-direction: column;
           gap: 0.5rem;
         }
         .control-group label {
           font-size: 0.8rem;
           color: var(--text-muted);
           font-family: var(--font-mono);
         }
         .run-btn {
           background: var(--accent-cyan);
           color: #000;
           border: none;
           padding: 0.75rem;
           border-radius: 4px;
           font-weight: 700;
           cursor: pointer;
         }
         .run-btn:disabled {
           opacity: 0.5;
         }
         .canvas-wrapper {
           flex: 1;
           background: #000;
           border: 1px solid #30363D;
           border-radius: 8px;
           position: relative;
         }
         .overlay-text {
           position: absolute;
           top: 50%;
           left: 50%;
           transform: translate(-50%, -50%);
           color: var(--text-muted);
           font-size: 0.9rem;
         }
       `}</style>
    </div>
  );
}
