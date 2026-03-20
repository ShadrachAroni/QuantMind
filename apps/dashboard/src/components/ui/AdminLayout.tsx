'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Shield, Activity, FileText, Settings, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Activity },
    { href: '/analytics', label: 'Growth & Revenue', icon: Shield },
    { href: '/users', label: 'User Management', icon: Users },
    { href: '/logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-text">Quant<span className="accent">Mind</span> <span className="admin-badge">Admin</span></span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #05070A;
          color: #fff;
        }

        .sidebar {
          width: 280px;
          background: rgba(26, 35, 50, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          padding: 2rem 0;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 100;
        }

        .sidebar-header {
          padding: 0 2rem 3rem;
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.5px;
        }

        .accent {
          color: var(--accent-cyan);
        }

        .admin-badge {
          font-size: 0.65rem;
          background: var(--accent-purple);
          padding: 2px 8px;
          border-radius: 4px;
          vertical-align: middle;
          margin-left: 4px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          color: var(--text-muted);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.95rem;
          font-weight: 500;
          position: relative;
        }

        .nav-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-item.active {
          color: #fff;
          background: rgba(0, 217, 255, 0.05);
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 3px;
          background: var(--accent-cyan);
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 10px var(--accent-cyan);
        }

        .sidebar-footer {
          padding: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          color: var(--error);
          font-weight: 600;
          width: 100%;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: rgba(255, 69, 58, 0.05);
        }

        .main-content {
          flex: 1;
          padding: 2.5rem 4rem;
          position: relative;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
