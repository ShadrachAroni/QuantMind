'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlassCard({ children, style, className = '', intensity = 'medium' }: GlassCardProps) {
  const opacities = {
    low: '0.02',
    medium: '0.05',
    high: '0.1'
  };

  const bgOpacity = opacities[intensity];

  return (
    <div className={`glass-card ${className}`} style={style}>
      {children}
      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, ${bgOpacity});
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          overflow: hidden;
          position: relative;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .glass-card:hover {
          background: rgba(255, 255, 255, calc(${bgOpacity} + 0.02));
          border-color: rgba(124, 58, 237, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 
                      0 0 20px rgba(124, 58, 237, 0.1);
          transform: translateY(-4px);
        }
      `}</style>
    </div>
  );
}
