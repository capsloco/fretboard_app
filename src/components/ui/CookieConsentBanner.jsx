import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CONSENT_KEY = 'fretlearn_cookie_consent';

function updateGoogleConsent(isGranted) {
  window.dataLayer = window.dataLayer || [];
  // gtag() must push the `arguments` object itself; GTM ignores plain arrays for consent commands
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

function readConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY); // 'granted' | 'denied' | null
  } catch {
    return null;
  }
}

export default function CookieConsentBanner({ isOpen, onClose, onOpenLegal }) {
  const [consentStatus, setConsentStatus] = useState(readConsent);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      return undefined;
    }
    if (consentStatus === null) {
      // First visit: ask after a moment so it doesn't fight the page for attention
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
    return undefined;
  }, [consentStatus, isOpen]);

  const choose = (granted) => {
    const value = granted ? 'granted' : 'denied';
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // not persisted; the choice still applies for this visit
    }
    setConsentStatus(value);
    updateGoogleConsent(granted);
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Cookie preferences" className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:max-w-sm z-50">
      <div className="card bg-base-100 border border-base-300 shadow-xl p-4 gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-bold uppercase tracking-[0.15em]">Cookies</h3>
          {consentStatus !== null && (
            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                onClose?.();
              }}
              className="btn btn-xs btn-ghost btn-square"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <p className="text-sm opacity-80">
          We’d like to use Google Analytics to count visits and see which features get used. No ads, no cross-site tracking.{' '}
          <button type="button" onClick={onOpenLegal} className="link">Privacy policy</button>
        </p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => choose(false)} className="btn btn-sm">No thanks</button>
          <button type="button" onClick={() => choose(true)} className="btn btn-sm btn-primary">Allow analytics</button>
        </div>
      </div>
    </aside>
  );
}
