import React, { useState, useRef, useEffect } from 'react';
import { Guitar, Sliders, LogIn, LogOut, User as UserIcon, ChevronDown, CheckCircle2 } from 'lucide-react';
import { signInWithGoogle, signOut } from '../../lib/supabase';

export default function Header({ currentInstrument, onOpenSettings, onOpenAuth, user, setUser }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
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

  return (
    <header className="w-full bg-slate-900/80 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl px-4 py-3 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Guitar className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0 leading-tight">
                FretLearn
              </h1>
            </div>
            <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Master the Fretboard
            </p>
          </div>
        </div>

        {/* Center / Right Control Items */}
        <div className="flex items-center gap-3">
          {/* Active Instrument Pill */}
          <button
            onClick={onOpenSettings}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-xs font-mono text-slate-300 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white">{currentInstrument?.title}</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Configure</span>
          </button>

          {/* User Auth Profile / Login Dropdown */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 transition-all shadow-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="max-w-[120px] truncate font-mono text-slate-200">
                  {user.email ? user.email.split('@')[0] : 'Account'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-fade-in">
                  <div className="px-2 py-1.5 mb-2 border-b border-slate-800">
                    <div className="text-xs font-bold text-white truncate">{user.email}</div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Cloud Sync Enabled</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenAuth) onOpenAuth();
                else signInWithGoogle();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors"
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
