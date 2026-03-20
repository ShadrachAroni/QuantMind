import React from 'react';

interface GlowEffectProps {
  color?: string;
  size?: number;
  opacity?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function GlowEffect({ 
  color = '#00D9FF', 
  size = 400, 
  opacity = 0.1,
  style,
  className = ''
}: GlowEffectProps) {
  return (
    <div 
      className={`glow-effect glow-ambient ${className}`} 
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity,
        position: 'absolute',
        zIndex: -1,
        pointerEvents: 'none',
        ...style
      }}
    />
  );
}
