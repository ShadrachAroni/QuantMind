'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Apple, Smartphone } from 'lucide-react';
import styles from './DownloadModal.module.css';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/components/UserContext';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  const { profile } = useUser();
  const t = useTranslation(profile?.interface_language || 'ENGLISH_INTL');
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle mounting and entering animation
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Small delay to trigger CSS transition
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      // Wait for exit animation before unmounting
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (visible) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [visible, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle outside click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div 
      className={`${styles.overlay} ${visible ? styles.visible : ''}`} 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={styles.modal} 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className={styles.closeBtn} 
          onClick={onClose}
          aria-label={t('CLOSE_MODAL')}
        >
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img src="/logo.png" alt="QuantMind" className={styles.logo} />
          </div>
          <h2 id="modal-title" className={styles.title}>{t('DOWNLOAD_MOBILE_TITLE')}</h2>
          <p className={styles.subtitle}>{t('DOWNLOAD_MOBILE_SUBTITLE')}</p>
        </div>

        <div className={styles.grid}>
          <button 
            className={styles.storeBtn}
            onClick={() => alert(t('SYNC_INITIALIZING'))}
          >
            <div className={styles.iconWrapper}>
              <Apple size={28} className="text-white" />
            </div>
            <div className={styles.storeText}>
              <span className={styles.label}>{t('IOS_PLATFORM')}</span>
              <span className={styles.name}>{t('GET_FOR_IOS')}</span>
            </div>
          </button>

          <button 
            className={styles.storeBtn}
            onClick={() => alert(t('SYNC_INITIALIZING'))}
          >
            <div className={styles.iconWrapper}>
              <Smartphone size={28} className="text-white" />
            </div>
            <div className={styles.storeText}>
              <span className={styles.label}>{t('ANDROID_PLATFORM')}</span>
              <span className={styles.name}>{t('GET_FOR_ANDROID')}</span>
            </div>
          </button>
        </div>

        <div className={styles.footer}>
          <div className={styles.statusDot} />
          <span className={styles.statusText}>{t('GLOBAL_SYNC_ACTIVE')}</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
