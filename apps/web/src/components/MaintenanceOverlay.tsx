'use client';

import React from 'react';
import { ShieldAlert, Clock, Terminal, Lock } from 'lucide-react';

export function MaintenanceOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0A0B10] flex items-center justify-center p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[100px] rounded-full" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

      <div className="relative max-w-xl w-full">
        {/* Diamond Icon Container */}
        <div className="flex justify-center mb-12 relative">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Pulsing Rings */}
            <div className="absolute inset-0 border border-red-500/20 rounded-full animate-ping [animation-duration:3s]" />
            <div className="absolute inset-4 border border-red-500/40 rounded-full animate-ping [animation-duration:2s]" />
            
            {/* The Core Icon */}
            <div className="relative z-10 w-20 h-20 bg-[#15161c] border border-red-500/50 rounded-[2rem] rotate-45 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.3)] group overflow-hidden">
               <div className="absolute inset-0 bg-red-500/10 -rotate-45" />
               <Lock className="text-red-500 -rotate-45" size={32} strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="text-center space-y-6">
          <div className="space-y-2">
            <span className="mono text-[10px] text-red-500 uppercase tracking-[0.4em] font-black">Protocol // Emergency_Downtime</span>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase font-jetbrains italic">
              System <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-500">Offline</span>
            </h1>
          </div>
          
          <div className="p-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldAlert size={64} />
             </div>
             
             <p className="text-gray-400 text-lg leading-relaxed font-medium">
               QuantMind core systems are currently undergoing <span className="text-white font-bold">critical infrastructure synchronization</span>. 
               All market-facing modules are temporarily restricted to ensure data integrity during the upgrade.
             </p>

             <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                   <Clock className="text-red-400" size={16} />
                   <span className="mono text-[11px] text-gray-300 font-bold uppercase tracking-widest">Est_Restore: 45m</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 rounded-2xl border border-red-500/20">
                   <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                   <span className="mono text-[11px] text-red-400 font-black uppercase tracking-widest">Admin_Override_Active</span>
                </div>
             </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600 mono text-[9px] uppercase tracking-widest">
              <Terminal size={12} />
              Session_Lock_Id: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-red-500/50 to-transparent rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
