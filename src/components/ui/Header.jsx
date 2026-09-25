import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, LogIn, LogOut, ChevronDown, ChevronUp, ChartColumn, Menu, Sun, Moon, User } from 'lucide-react';
import { signOut } from '../../lib/supabase';

function ThemeSwap({ theme, onChangeTheme, className = '' }) {
  const isNight = theme === 'tolex';
  return (
    <label className={`swap swap-rotate btn btn-sm btn-ghost btn-square ${className}`} title={isNight ? 'Switch to day (Tweed)' : 'Switch to night (Tolex)'}>
      <input
        type="checkbox"
        checked={isNight}
        onChange={(e) => onChangeTheme(e.target.checked ? 'tolex' : 'tweed')}
        aria-label="Night theme"
      />
      <Sun className="swap-off size-4" aria-hidden="true" />
      <Moon className="swap-on size-4" aria-hidden="true" />
    </label>
  );
}

export default function Header({
  onOpenSettings,
  onOpenAuth,
  onOpenHistory,
  onGoHome,
  user,
  setUser,
  isSessionRunning = false,
  theme,
  onChangeTheme
}) {
  const [isCollapsed, setIsCollapsed] = useState(isSessionRunning);

  // Tuck the header away during a round, bring it back afterwards
  useEffect(() => {
    setIsCollapsed(isSessionRunning);
  }, [isSessionRunning]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const accountName = user?.email ? user.email.split('@')[0] : 'Account';

  if (isSessionRunning && isCollapsed) {
    return (
      <div className="sticky top-0 z-40 flex justify-center pointer-events-none">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="pointer-events-auto bg-cabinet border-x-2 border-b-2 border-(--piping) rounded-b-box px-4 pt-0.5 pb-1 flex items-center gap-1.5 shadow-md"
          aria-label="Show menu"
        >
          <span className="font-script text-lg leading-none">FretLearn</span>
          <ChevronDown className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <header className="navbar bg-cabinet border-b-4 border-(--piping) sticky top-0 z-40 px-3 sm:px-6 shadow-md min-h-14">
      <div className="navbar-start">
        <button
          type="button"
          onClick={onGoHome}
          disabled={!onGoHome}
          className="flex items-baseline gap-3 text-left disabled:cursor-default"
          aria-label="FretLearn home"
        >
          <span className="font-script text-3xl sm:text-4xl leading-none text-stamped">FretLearn</span>
          <span className="hidden md:inline font-display font-semibold uppercase tracking-[0.25em] text-xs">
            Fretboard trainer
          </span>
        </button>
      </div>

      <div className="navbar-end gap-1">
        {isSessionRunning && (
          <button type="button" onClick={() => setIsCollapsed(true)} className="btn btn-sm btn-ghost font-display uppercase tracking-wider">
            <ChevronUp className="size-4" /> <span className="hidden sm:inline">Hide</span>
          </button>
        )}

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {!isSessionRunning && (
            <button type="button" onClick={onOpenHistory} className="btn btn-sm btn-ghost font-display uppercase tracking-wider">
              <ChartColumn className="size-4" /> Stats
            </button>
          )}
          <button type="button" onClick={onOpenSettings} className="btn btn-sm btn-ghost font-display uppercase tracking-wider">
            <SlidersHorizontal className="size-4" /> Settings
          </button>
          <ThemeSwap theme={theme} onChangeTheme={onChangeTheme} />

          {user ? (
            <>
              <button
                type="button"
                popoverTarget="account-menu"
                style={{ anchorName: '--account-menu' }}
                className="btn btn-sm btn-ghost font-display tracking-wider"
              >
                <User className="size-4" />
                <span className="max-w-32 truncate normal-case">{accountName}</span>
                <ChevronDown className="size-3.5 opacity-70" />
              </button>
              <ul
                id="account-menu"
                popover="auto"
                style={{ positionAnchor: '--account-menu' }}
                className="dropdown dropdown-end menu w-64 rounded-box bg-base-100 text-base-content shadow-lg border border-base-300 mt-2"
              >
                <li className="menu-title">
                  <span className="truncate normal-case">{user.email}</span>
                  <span className="text-xs font-normal text-success">Progress syncs to your account</span>
                </li>
                <li>
                  <button type="button" popoverTarget="account-menu" popoverTargetAction="hide" onClick={handleSignOut}>
                    <LogOut className="size-4" /> Sign out
                  </button>
                </li>
              </ul>
            </>
          ) : (
            <button type="button" onClick={onOpenAuth} className="btn btn-sm btn-neutral font-display uppercase tracking-wider ml-1">
              <LogIn className="size-4" /> Sign in
            </button>
          )}
        </div>

        {/* Mobile */}
        <div className="flex sm:hidden items-center gap-1">
          <ThemeSwap theme={theme} onChangeTheme={onChangeTheme} />
          <button
            type="button"
            popoverTarget="mobile-menu"
            style={{ anchorName: '--mobile-menu' }}
            className="btn btn-ghost btn-square"
            aria-label="Open menu"
          >
            <Menu className="size-6" />
          </button>
          <ul
            id="mobile-menu"
            popover="auto"
            style={{ positionAnchor: '--mobile-menu' }}
            className="dropdown dropdown-end menu menu-lg w-64 rounded-box bg-base-100 text-base-content shadow-lg border border-base-300 mt-2"
          >
            {!isSessionRunning && (
              <li>
                <button type="button" popoverTarget="mobile-menu" popoverTargetAction="hide" onClick={onOpenHistory}><ChartColumn className="size-5" /> Stats</button>
              </li>
            )}
            <li>
              <button type="button" popoverTarget="mobile-menu" popoverTargetAction="hide" onClick={onOpenSettings}><SlidersHorizontal className="size-5" /> Settings</button>
            </li>
            {user ? (
              <>
                <li className="menu-title normal-case truncate">{user.email}</li>
                <li>
                  <button type="button" popoverTarget="mobile-menu" popoverTargetAction="hide" onClick={handleSignOut}><LogOut className="size-5" /> Sign out</button>
                </li>
              </>
            ) : (
              <li>
                <button type="button" popoverTarget="mobile-menu" popoverTargetAction="hide" onClick={onOpenAuth}><LogIn className="size-5" /> Sign in</button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
}
