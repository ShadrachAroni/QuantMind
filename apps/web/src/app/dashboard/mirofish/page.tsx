'use client';

import React, { useState } from 'react';
import { VariableInjector } from '@/components/Sandbox/VariableInjector';
import { InteractionWeb } from '@/components/Sandbox/InteractionWeb';
import { GlassCard } from '@/components/ui/GlassCard';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { Layers } from 'lucide-react';

export default function MiroFishSandbox() {
  const [simulationData, setSimulationData] = useState<any[]>([]);

  const handleRunSimulation = async (seed: string) => {
    console.log("Connecting to MiroFish Engine with seed:", seed);
    
    try {
      const response = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed })
      });

      if (!response.ok) throw new Error('Simulation failed to start');
      
      const data = await response.json();
      console.log("Simulation Result:", data);

      if (data.interactions_log) {
        setSimulationData(data.interactions_log);
      }
      
    } catch (error) {
      console.error("MiroFish Engine Error:", error);
      alert("Failed to connect to the simulation engine. Check backend connectivity.");
    }
  };

  return (
    <FeatureGate requiredTier="pro" featureName="MiroFish Engine">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-tight flex items-center gap-3">
              <Layers className="text-[#00D9FF]" size={32} />
              MiroFish Engine
            </h1>
            <p className="text-[#848D97] mt-2 font-mono text-sm max-w-2xl">
              God's-Eye View: Inject variables into a parallel digital world and observe the reflexive evolution of thousands of AI agents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <VariableInjector onRunSimulation={handleRunSimulation} />
            
            <GlassCard className="flex-1">
              <h3 className="text-sm font-mono text-white mb-4 uppercase tracking-widest">
                Simulation Trajectory
              </h3>
              {simulationData.length === 0 ? (
                <div className="text-xs text-[#848D97] font-mono">
                  Awaiting seed variable injection...
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {simulationData.map((step) => (
                    <div key={step.tick} className="p-2 rounded bg-white/5 border border-white/5 text-xs font-mono text-[#848D97] flex justify-between">
                      <span>Tick {step.tick}</span>
                      <span className="text-[#00D9FF]">Resolved</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
          
          <div className="lg:col-span-2">
            <InteractionWeb data={simulationData} />
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
