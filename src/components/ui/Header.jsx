import React, { useState, useRef, useEffect } from 'react';
import { Guitar, Sliders, LogIn, LogOut, User as UserIcon, ChevronDown, ChevronUp, CheckCircle2, Zap, Palette } from 'lucide-react';
import { signInWithGoogle, signOut } from '../../lib/supabase';
import {
  getTuningsForInstrument,
  groupTuningsByCategory,
  findMatchingTuningPreset
} from '../../lib/fretLogic';

const THEME_PRESETS = [
  { group: '☀️ Clean & Light', themes: ['emerald', 'nord', 'corporate', 'winter', 'silk', 'autumn', 'retro', 'light'] },
  { group: '🌙 Dark & Night', themes: ['dim', 'night', 'sunset', 'dracula', 'abyss'] },
  { group: '⚡ Vibrant & Neon', themes: ['synthwave', 'cyberpunk', 'acid'] }
];

export default function Header({
  currentInstrument,
  onOpenSettings,
  onOpenAuth,
  user,
  setUser,
  onSelectTuning,
  isSessionRunning = false
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('fretlearn_theme') || 'emerald');
  const menuRef = useRef(null);
  const themeRef = useRef(null);

  // Apply active theme to document html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('fretlearn_theme', currentTheme);
  }, [currentTheme]);

  // Auto-collapse header when session starts, auto-expand when session ends
  useEffect(() => {
    if (isSessionRunning) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isSessionRunning]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    setUser(null);
  };

  const availableTunings = getTuningsForInstrument(
    currentInstrument?.stringCount || 6,
    currentInstrument?.type
  );
  const groupedTunings = groupTuningsByCategory(availableTunings);
  const matchingPreset = findMatchingTuningPreset(
    currentInstrument?.tuning,
    currentInstrument?.stringCount
  );
  const activeTuningId = currentInstrument?.tuningId || (matchingPreset ? matchingPreset.id : 'custom');

  // Dead-centered, ultra-minimal arrow handle during active practice session
  if (isSessionRunning && isCollapsed) {
    return (
      <div className="w-full sticky top-0 z-40 flex justify-center pointer-events-none">
        <button
          onClick={() => setIsCollapsed(false)}
          className="pointer-events-auto btn btn-sm btn-ghost bg-base-200/90 hover:bg-base-300 border-x border-b border-base-300 text-primary shadow-xl backdrop-blur-md rounded-b-2xl px-5 cursor-pointer flex items-center justify-center gap-1.5 group"
          title="Expand Header Menu"
        >
          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <header className="navbar bg-base-100/90 border-b border-base-300 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8">
      <div className="navbar-start flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md">
          <Guitar className="w-6 h-6 text-primary-content stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-base-content m-0 leading-tight">
              FretLearn
            </h1>
            <span className="badge badge-primary badge-sm font-bold">v1.1</span>
          </div>
          <p className="text-[11px] font-mono text-base-content/70 hidden sm:block">
            Master the Fretboard
          </p>
        </div>
      </div>

      {/* Center & End Controls */}
      <div className="navbar-end flex items-center gap-2 sm:gap-3">
        {/* Active Instrument & On-The-Fly Tuning Selector */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="btn btn-sm btn-soft btn-neutral font-mono font-bold flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>{currentInstrument?.title}</span>
          </button>

          {/* Quick Tuning Selector */}
          {availableTunings.length > 0 && (
            <div className="flex items-center gap-1 bg-base-200 border border-base-300 rounded-lg px-2.5 py-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <select
                aria-label="Select instrument tuning"
                value={activeTuningId}
                onChange={(e) => {
                  if (onSelectTuning) {
                    onSelectTuning(e.target.value);
                  }
                }}
                className="select select-xs select-ghost font-mono font-bold text-primary focus:outline-none cursor-pointer"
              >
                {Object.entries(groupedTunings).map(([category, tunings]) => (
                  <optgroup key={category} label={category} className="bg-base-200 text-base-content font-bold">
                    {tunings.map(t => (
                      <option key={t.id} value={t.id} className="bg-base-100 text-base-content">
                        {t.name} ({t.tuning.join(' ')})
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom" className="bg-base-100 text-primary font-bold">
                  Custom Tuning ({currentInstrument?.tuning?.join(' ')})
                </option>
              </select>
            </div>
          )}
        </div>

        {/* Collapse Header Button during Active Practice Session */}
        {isSessionRunning && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="btn btn-sm btn-ghost text-primary flex items-center gap-1 font-mono font-bold"
            title="Collapse Header"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collapse</span>
          </button>
        )}

        {/* Theme Selector Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="btn btn-sm btn-outline btn-neutral flex items-center gap-1.5 font-bold"
            title="Switch Theme Preset"
          >
            <Palette className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline capitalize">{currentTheme}</span>
            <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isThemeMenuOpen && (
            <div className="dropdown-content menu p-3 shadow-2xl bg-base-100 rounded-box w-56 absolute right-0 mt-2 z-50 border border-base-300 max-h-96 overflow-y-auto">
              <div className="text-xs font-bold text-base-content/60 px-2 pb-2 mb-1 border-b border-base-200 uppercase tracking-wider font-mono">
                Theme Presets
              </div>
              {THEME_PRESETS.map((group) => (
                <div key={group.group} className="mb-2">
                  <div className="text-[11px] font-bold text-primary px-2 py-1 uppercase font-mono">
                    {group.group}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {group.themes.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setCurrentTheme(t);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`btn btn-xs justify-start capitalize font-bold ${
                          currentTheme === t ? 'btn-primary' : 'btn-ghost'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Modal Button */}
        <button
          onClick={onOpenSettings}
          className="btn btn-sm btn-outline btn-neutral flex items-center gap-1.5 font-bold"
        >
          <Sliders className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Configure</span>
        </button>

        {/* User Auth Profile / Login Dropdown */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="btn btn-sm btn-ghost flex items-center gap-2 font-mono"
            >
              <div className="avatar placeholder">
                <div className="bg-success text-success-content rounded-full w-6 h-6 flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="max-w-[120px] truncate">
                {user.email ? user.email.split('@')[0] : 'Account'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <ul className="dropdown-content menu p-3 shadow-2xl bg-base-100 rounded-box w-64 absolute right-0 mt-2 z-50 border border-base-300">
                <li className="menu-title px-2 py-1 border-b border-base-200">
                  <div className="text-xs font-bold text-base-content truncate">{user.email}</div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-success mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Cloud Sync Enabled</span>
                  </div>
                </li>
                <li className="mt-2">
                  <button
                    onClick={handleSignOut}
                    className="text-error font-bold hover:bg-error/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              if (onOpenAuth) onOpenAuth();
              else signInWithGoogle();
            }}
            className="btn btn-sm btn-primary flex items-center gap-1.5 font-bold"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
