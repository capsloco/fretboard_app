import React, { useState, useRef, useEffect } from 'react';
import { Guitar, Sliders, LogIn, LogOut, User as UserIcon, ChevronDown, ChevronUp, CheckCircle2, BarChart3, Menu, X } from 'lucide-react';
import { signInWithGoogle, signOut } from '../../lib/supabase';

export default function Header({
  onOpenSettings,
  onOpenAuth,
  onOpenHistory,
  user,
  setUser,
  isSessionRunning = false
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Auto-collapse header when session starts, auto-expand when session ends
  useEffect(() => {
    if (isSessionRunning) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isSessionRunning]);

  // Close mobile menu on session start/collapse so it can't linger over the floating handle
  useEffect(() => {
    if (isSessionRunning) {
      setIsMobileMenuOpen(false);
    }
  }, [isSessionRunning]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
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

  // Sleek, ultra-minimal floating arrow handle during active practice session
  if (isSessionRunning && isCollapsed) {
    return (
      <div className="w-full sticky top-0 z-40 flex justify-center pointer-events-none pt-1">
        <button
          onClick={() => setIsCollapsed(false)}
          className="pointer-events-auto p-2 text-primary/80 hover:text-primary transition-colors duration-200 cursor-pointer flex items-center justify-center rounded-full hover:bg-base-200/50 backdrop-blur-xs group"
          title="Expand Header Menu"
        >
          <ChevronDown className="w-6 h-6 drop-shadow-sm group-hover:translate-y-0.5 transition-transform" />
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
          </div>
          <p className="text-[11px] font-mono text-base-content/70 hidden sm:block">
            Master the Fretboard
          </p>
        </div>
      </div>

      {/* Center & End Controls */}
      <div className="navbar-end flex items-center gap-2 sm:gap-3">

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

        {/* Desktop Controls */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          {/* History & Stats Button */}
          {!isSessionRunning && onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="btn btn-sm bg-base-200 hover:bg-base-300 border border-base-300 text-base-content font-bold flex items-center gap-1.5 shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Stats</span>
            </button>
          )}

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="btn btn-sm bg-base-200 hover:bg-base-300 border border-base-300 text-base-content font-bold flex items-center gap-1.5 shadow-sm"
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
                <div className="avatar avatar-placeholder">
                  <div className="bg-success text-success-content rounded-full w-6 h-6 flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="max-w-[120px] truncate">
                  {user.email ? user.email.split('@')[0] : 'Account'}
                </span>
                <ChevronDown className={isUserMenuOpen ? 'w-3.5 h-3.5 opacity-70 transition-transform rotate-180' : 'w-3.5 h-3.5 opacity-70 transition-transform'} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <ul className="menu p-3 shadow-2xl bg-base-100 rounded-box w-64 absolute right-0 mt-2 z-50 border border-base-300">
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

        {/* Mobile Hamburger Menu */}
        <div className="sm:hidden relative" ref={mobileMenuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-square bg-base-200 hover:bg-base-300 border border-base-300 text-base-content shadow-sm min-h-11 h-11 w-11"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {isMobileMenuOpen && (
            <div className="p-4 shadow-2xl bg-base-100 rounded-2xl fixed left-4 right-4 top-16 z-50 border border-base-300 max-h-[80vh] overflow-y-auto space-y-4">
              {/* Navigation — sized for comfortable tap targets (44px min height) */}
              <div className="flex flex-col gap-2">
                {!isSessionRunning && onOpenHistory && (
                  <button
                    onClick={() => { onOpenHistory(); setIsMobileMenuOpen(false); }}
                    className="btn btn-md min-h-11 btn-ghost justify-start gap-2.5 font-bold text-base border border-base-200/80 hover:bg-base-200"
                  >
                    <BarChart3 className="w-5 h-5 text-primary" /> Stats
                  </button>
                )}
                <button
                  onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
                  className="btn btn-md min-h-11 btn-ghost justify-start gap-2.5 font-bold text-base border border-base-200/80 hover:bg-base-200"
                >
                  <Sliders className="w-5 h-5 text-primary" /> Configure
                </button>
              </div>

              {/* Auth */}
              <div className="border-t border-base-200 pt-3">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                      <div className="avatar avatar-placeholder">
                        <div className="bg-success text-success-content rounded-full w-6 h-6 flex items-center justify-center">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-base-content truncate">{user.email}</div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-success">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cloud Sync Enabled</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                      className="btn btn-md min-h-11 justify-start gap-2.5 font-bold text-base text-error hover:bg-error/10"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                      else signInWithGoogle();
                      setIsMobileMenuOpen(false);
                    }}
                    className="btn btn-md min-h-11 btn-primary w-full gap-2 font-bold text-base"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
