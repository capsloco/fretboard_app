import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, X } from 'lucide-react';

export function updateGoogleConsent(isGranted) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('consent', 'update', {
      analytics_storage: isGranted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
}

export default function CookieConsentBanner({ isOpen, onClose, onOpenLegal }) {
  const [consentStatus, setConsentStatus] = useState(() => {
    return localStorage.getItem('fretlearn_cookie_consent'); // 'granted' | 'denied' | null
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else if (consentStatus === null) {
      // Show banner automatically on first visit after a slight delay
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [consentStatus, isOpen]);

  const handleAccept = () => {
    localStorage.setItem('fretlearn_cookie_consent', 'granted');
    setConsentStatus('granted');
    updateGoogleConsent(true);
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleDecline = () => {
    localStorage.setItem('fretlearn_cookie_consent', 'denied');
    setConsentStatus('denied');
    updateGoogleConsent(false);
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent Settings"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[90] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="card bg-base-100 border border-base-300 shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-base-content flex items-center gap-1.5 m-0 leading-tight">
                Privacy & Cookies
              </h3>
              <p className="text-[11px] font-mono text-base-content/70 m-0">
                FretLearn Privacy Settings
              </p>
            </div>
          </div>

          {consentStatus !== null && (
            <button
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
              className="btn btn-xs btn-ghost btn-circle text-base-content/70 hover:text-base-content"
              aria-label="Close Privacy Banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-base-content/80 leading-relaxed font-sans m-0">
          We use Google Analytics (GA4) to measure general usage statistics and improve your fretboard practice experience. No advertising or cross-site tracking cookies are used.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-base-200">
          <button
            onClick={onOpenLegal}
            className="btn btn-xs btn-ghost text-primary text-[11px] font-mono justify-start sm:justify-center"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Read Policy
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDecline}
              className="btn btn-sm btn-ghost border border-base-300 text-base-content hover:bg-base-200 flex-1 sm:flex-none font-bold text-xs"
            >
              Necessary Only
            </button>

            <button
              onClick={handleAccept}
              className="btn btn-sm btn-primary flex-1 sm:flex-none font-bold text-xs gap-1 shadow-md"
            >
              <Check className="w-3.5 h-3.5" /> Accept All
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
