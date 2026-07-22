import React from 'react';
import { Guitar, Sliders, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { isSupabaseConfigured, signInWithGoogle, signOut } from '../../lib/supabase';

export default function Header({ currentInstrument, onOpenSettings, user, setUser }) {
  const handleAuth = async () => {
    if (user) {
      await signOut();
      setUser(null);
    } else {
      await signInWithGoogle();
    }
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
                FretFlow
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                MVP
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Hands-Free High-Visibility Fretboard Trainer
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

          {/* Supabase Auth Login Button */}
          {isSupabaseConfigured && (
            <button
              onClick={handleAuth}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors"
            >
              {user ? (
                <>
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Sign Out</span>
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-cyan-400" />
                  <span>Google Sign In</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
