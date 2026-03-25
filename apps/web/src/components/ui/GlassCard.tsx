import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
}

export function GlassCard({ children, className, intensity = 'medium', ...props }: GlassCardProps) {
  const intensities = {
    low: 'bg-[var(--glass-bg)] border-[var(--glass-border)] opacity-90',
    medium: 'bg-[var(--glass-bg)] border-[var(--glass-border)] backdrop-blur-md',
    high: 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] backdrop-blur-xl',
  };

  return (
    <div 
      className={cn(
        'rounded-2xl border transition-all duration-300',
        intensities[intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
