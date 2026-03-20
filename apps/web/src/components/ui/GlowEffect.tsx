import React from 'react';

interface GlowEffectProps {
  color?: string;
  size?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function GlowEffect({ 
  color = '#00D9FF', 
  size = 400, 
  opacity = 0.15,
  className,
  style
}: GlowEffectProps) {
  return (
    <div 
      className={`pointer-events-none absolute z-0 rounded-full blur-[100px] animate-pulse-glow ${className}`}
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        width: size,
        height: size,
        opacity,
        ...style
      }}
    />
  );
}
