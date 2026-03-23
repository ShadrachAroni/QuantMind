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
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
}
