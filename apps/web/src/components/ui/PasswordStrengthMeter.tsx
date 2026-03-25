import React from 'react';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';

zxcvbnOptions.setOptions({
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
});

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const result = zxcvbn(password);
  const score = password ? result.score : -1;

  const getScoreColor = (s: number) => {
    switch (s) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-orange-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-[#00D9FF]';
      default: return 'bg-white/10';
    }
  };

  const getScoreLabel = (s: number) => {
    switch (s) {
      case 0: return 'LOW_ENTROPY';
      case 1: return 'VULNERABLE';
      case 2: return 'STANDARD';
      case 3: return 'SECURE';
      case 4: return 'PROTOCOL_SECURE';
      default: return 'WAITING_FOR_INPUT';
    }
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#848D97] font-bold">
          Cipher Strength
        </span>
        <span className={`text-[10px] uppercase tracking-[0.15em] font-mono font-bold ${score === 4 ? 'text-[#00D9FF] text-glow' : 'text-[#848D97]'}`}>
          {getScoreLabel(score)}
        </span>
      </div>
      <div className="flex gap-1 h-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-500 ${
              score > i ? getScoreColor(score) : 'bg-white/5'
            }`}
          />
        ))}
      </div>
      
      {password && result.feedback.warning && (
        <p className="text-[10px] text-orange-500/80 mt-1 italic">
          {result.feedback.warning}
        </p>
      )}

      <style jsx>{`
        .text-glow {
          text-shadow: 0 0 8px rgba(0, 217, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
