export const THEMES = [
  { id: 'tweed', name: 'Tweed', description: 'Aged cream lacquer and butterscotch. Best in daylight.' },
  { id: 'tolex', name: 'Tolex', description: 'Black amp covering with an amber lamp glow. Easy on the eyes at night.' }
];

const STORAGE_KEY = 'fretlearn_theme';

/** Saved theme, or the system preference when nothing valid is saved (e.g. an old stock theme) */
export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some(t => t.id === saved)) return saved;
  } catch {
    // storage blocked; fall through to the system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'tolex' : 'tweed';
}

export function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // not persisted; the theme still applies for this visit
  }
}
