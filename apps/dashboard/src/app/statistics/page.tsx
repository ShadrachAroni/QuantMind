'use client';

import React from 'react';
import { AdminLayout } from '../../components/ui/AdminLayout';
import { SpectralChart } from '../../components/dashboard/SpectralChart';
import { BarChart3 } from 'lucide-react';

export default function StatisticsPage() {
  const data = [
    { name: 'Mon', value: 2400 },
    { name: 'Tue', value: 1398 },
    { name: 'Wed', value: 9800 },
    { name: 'Thu', value: 3908 },
    { name: 'Fri', value: 4800 },
    { name: 'Sat', value: 3800 },
    { name: 'Sun', value: 4300 },
  ];

  return (
    <AdminLayout>
      <div className="animate-slide-up">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-white">System Statistics</h1>
            <p className="text-slate-500 mt-2">Deep-dive telemetry for platform performance and load.</p>
          </div>
          <div className="flex gap-4">
             <button className="px-6 py-2 bg-white/5 text-white rounded-lg text-sm font-bold border border-white/10 hover:bg-white/10 transition-all">Export JSON</button>
             <button className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all">Live Oracle Feed</button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
           <div className="h-[400px]">
              <SpectralChart title="Kernel Throughput (TPS)" data={data} />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                 { label: 'AVG_LATENCY', val: '42ms', trend: '-5%' },
                 { label: 'ERROR_RATE', val: '0.02%', trend: '-1%' },
                 { label: 'NODE_UPTIME', val: '99.98%', trend: '+0%' },
                 { label: 'CONCURRENT_USERS', val: '1,244', trend: '+12%' },
              ].map(stat => (
                 <div key={stat.label} className="p-6 bg-[#1A1B23] rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 block mb-2">{stat.label}</span>
                    <div className="flex justify-between items-end">
                       <span className="text-2xl font-black text-white">{stat.val}</span>
                       <span className={`text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-cyan-400'}`}>{stat.trend}</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </AdminLayout>
  );
}
