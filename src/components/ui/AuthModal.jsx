import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import Modal from './Modal';
import { signInWithGoogle, supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function AuthModal({ isOpen, onClose, setUser, initialMode = 'normal', onOpenLegal }) {
  const [activeTab, setActiveTab] = useState('magic'); // 'magic' | 'password'
  const [mode, setMode] = useState(initialMode); // 'normal' | 'forgot' | 'update_password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setMessage({ type: 'error', text: error.message || 'Google sign in failed.' });
      setLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Sign-in link sent. Check your inbox.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send magic link.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPassword = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setMessage(null);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        if (data?.user && !data?.session) {
          setMessage({ type: 'success', text: 'Account created! Please check your email to confirm.' });
        } else {
          setUser(data.user);
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setUser(data.user);
        onClose();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Authentication failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password reset link sent. Check your inbox.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send reset link.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated.' });
      setTimeout(() => {
        setMode('normal');
        onClose();
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'forgot' ? 'Reset your password' : mode === 'update_password' ? 'Set a new password' : 'Sign in';
  const subtitle = mode === 'forgot'
    ? 'We’ll email you a link to reset it.'
    : mode === 'update_password'
      ? 'Choose a new password for your account.'
      : 'Keep your stats, custom instruments and settings in sync across devices.';

  const emailField = (
    <label className="input w-full">
      <Mail className="size-4 opacity-50" aria-hidden="true" />
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" />
    </label>
  );

  return (
    <Modal open={isOpen} onClose={onClose} labelledBy="auth-title" className="max-w-md">
      <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-square absolute top-3 right-3" aria-label="Close">
        <X className="size-5" />
      </button>

      <header className="text-center mb-5">
        <div className="font-script text-4xl text-secondary leading-none">FretLearn</div>
        <h2 id="auth-title" className="font-display font-bold uppercase tracking-[0.15em] text-2xl mt-2">{title}</h2>
        <p className="text-sm opacity-80 mt-1">{subtitle}</p>
      </header>

      {!isSupabaseConfigured && (
        <div role="alert" className="alert mb-4 text-sm items-start">
          <KeyRound className="size-4 mt-0.5" aria-hidden="true" />
          <span>
            Accounts are off in this build. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to
            your <code>.env</code> to turn them on. Everything else works without an account.
          </span>
        </div>
      )}

      {message && (
        <div role="status" className={`alert alert-soft mb-4 text-sm ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.type === 'success' ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <AlertCircle className="size-4" aria-hidden="true" />}
          <span>{message.text}</span>
        </div>
      )}

      {mode === 'update_password' && (
        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <label className="input w-full">
            <Lock className="size-4 opacity-50" aria-hidden="true" />
            <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" aria-label="New password" />
          </label>
          <button type="submit" disabled={loading} className="btn btn-primary w-full font-display uppercase tracking-wider">
            Update password
          </button>
        </form>
      )}

      {mode === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-3">
          {emailField}
          <button type="submit" disabled={loading} className="btn btn-primary w-full font-display uppercase tracking-wider">
            Send reset link
          </button>
          <button type="button" onClick={() => setMode('normal')} className="btn btn-ghost btn-sm w-full">
            <ArrowLeft className="size-4" /> Back to sign in
          </button>
        </form>
      )}

      {mode === 'normal' && (
        <div className="space-y-4">
          <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="btn w-full">
            <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <div className="divider text-xs uppercase tracking-widest opacity-70 my-2">or use email</div>

          <div role="tablist" className="tabs tabs-box tabs-sm">
            <button type="button" role="tab" aria-selected={activeTab === 'magic'} onClick={() => setActiveTab('magic')} className={`tab flex-1 ${activeTab === 'magic' ? 'tab-active' : ''}`}>
              Email link
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'password'} onClick={() => setActiveTab('password')} className={`tab flex-1 ${activeTab === 'password' ? 'tab-active' : ''}`}>
              Password
            </button>
          </div>

          {activeTab === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-3">
              {emailField}
              <button type="submit" disabled={loading} className="btn btn-primary w-full font-display uppercase tracking-wider">
                Email me a sign-in link
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleEmailPassword} className="space-y-3">
              {emailField}
              <label className="input w-full">
                <Lock className="size-4 opacity-50" aria-hidden="true" />
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" />
              </label>
              <button type="submit" disabled={loading} className="btn btn-primary w-full font-display uppercase tracking-wider">
                {isSignUp ? 'Create account' : 'Sign in'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="link link-hover">
                  {isSignUp ? 'I already have an account' : 'Create an account'}
                </button>
                {!isSignUp && (
                  <button type="button" onClick={() => setMode('forgot')} className="link link-hover">
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      <footer className="mt-5 pt-3 border-t border-base-300 flex justify-center gap-4 text-xs opacity-80">
        <button type="button" onClick={() => onOpenLegal?.('privacy')} className="link link-hover">Privacy</button>
        <button type="button" onClick={() => onOpenLegal?.('terms')} className="link link-hover">Terms</button>
      </footer>
    </Modal>
  );
}
