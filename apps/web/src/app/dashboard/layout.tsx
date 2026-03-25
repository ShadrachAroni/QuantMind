import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TickerTape } from '@/components/layout/TickerTape';
import { MfaGuardian } from '@/components/MfaGuardian';
import { MobileNavProvider } from '@/components/layout/MobileNavContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileNavProvider>
      <div className="flex h-screen bg-[#05070A] overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0 relative">
          <TickerTape />
          <Header />
          
          <main className="flex-1 overflow-y-auto bg-[#05070A] relative custom-scrollbar">
             {/* Global Ambient Glow */}
             <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00D9FF]/5 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 -left-24 w-96 h-96 bg-[#7C3AED]/5 rounded-full blur-[120px]" />
             </div>
  
              <MfaGuardian>
                {children}
              </MfaGuardian>
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
