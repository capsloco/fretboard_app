// Optional Google Tag Manager, loaded only when VITE_GTM_ID is set.
// Consent Mode v2: analytics stays denied until the visitor opts in.

const GTM_ID = import.meta.env.VITE_GTM_ID;
const CONSENT_KEY = 'fretlearn_cookie_consent';

export const isAnalyticsEnabled = Boolean(GTM_ID);

// gtag() must push the `arguments` object itself; GTM ignores plain arrays for consent commands
function gtag() {
  window.dataLayer.push(arguments);
}

function consentState(granted) {
  return {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  };
}

export function readConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY); // 'granted' | 'denied' | null
  } catch {
    return null;
  }
}

export function initAnalytics() {
  if (!isAnalyticsEnabled) return;
  window.dataLayer = window.dataLayer || [];
  gtag('consent', 'default', consentState(readConsent() === 'granted'));
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);
}

export function setConsent(granted) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    // not persisted; the choice still applies for this visit
  }
  if (!isAnalyticsEnabled) return;
  window.dataLayer = window.dataLayer || [];
  gtag('consent', 'update', consentState(granted));
}
