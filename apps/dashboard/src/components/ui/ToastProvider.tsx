'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, LucideIcon } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    
    // Auto remove after specified duration or 5s default
    const ttl = duration || (type === 'info' ? 3000 : 5000);
    setTimeout(() => removeToast(id), ttl);
  }, [removeToast]);

  const success = (title: string, message?: string, duration?: number) => addToast('success', title, message, duration);
  const error = (title: string, message?: string, duration?: number) => addToast('error', title, message, duration);
  const info = (title: string, message?: string, duration?: number) => addToast('info', title, message, duration);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRootClose={() => removeToast(t.id)} />
        ))}
      </div>

      <style jsx global>{`
        .toast-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          pointer-events: none;
        }

        .toast-item {
          pointer-events: auto;
          width: 320px;
          background: rgba(10, 15, 25, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .toast-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
        }

        .toast-item.success::before { background: #10B981; }
        .toast-item.error::before { background: #EF4444; }
        .toast-item.info::before { background: #00D9FF; }
        .toast-item.warning::before { background: #F59E0B; }

        .toast-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .toast-content {
          flex: 1;
        }

        .toast-title {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
          color: #fff;
        }

        .toast-message {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
        }

        .toast-close {
          opacity: 0.5;
          transition: opacity 0.2s;
          cursor: pointer;
        }

        .toast-close:hover {
          opacity: 1;
        }

        @keyframes toast-in {
          from { transform: translateX(100%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRootClose }: { toast: Toast, onRootClose: () => void }) {
  const icons: Record<ToastType, LucideIcon> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  };

  const colors: Record<ToastType, string> = {
    success: '#10B981',
    error: '#EF4444',
    info: '#00D9FF',
    warning: '#F59E0B',
  };

  const Icon = icons[toast.type];

  return (
    <div className={`toast-item ${toast.type}`}>
      <div className="toast-icon">
        <Icon size={18} color={colors[toast.type]} />
      </div>
      <div className="toast-content">
        <h4 className="toast-title">{toast.title}</h4>
        {toast.message && <p className="toast-message">{toast.message}</p>}
      </div>
      <button className="toast-close" onClick={onRootClose}>
        <X size={14} color="#fff" />
      </button>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
