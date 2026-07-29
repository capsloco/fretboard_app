import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'privacy' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'privacy' | 'terms'

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-200 max-h-[85vh] flex flex-col my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Legal & Compliance</h3>
              <p className="text-xs font-mono text-slate-400">FretLearn Policies & Guidelines</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0 text-xs font-mono">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'privacy'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'terms'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 text-sm leading-relaxed text-slate-300 pr-2 font-sans selection:bg-cyan-500 selection:text-slate-950">
          {activeTab === 'privacy' ? (
            <div className="space-y-4">
              <div className="bg-cyan-950/40 border border-cyan-900/50 rounded-2xl p-4 text-xs font-mono text-cyan-300 space-y-1">
                <strong className="text-white block font-bold">Privacy Summary</strong>
                <p>
                  FretLearn respects your privacy. We collect minimal data necessary to authenticate your account and synchronize your fretboard practice settings and statistics. We do not sell or share your personal information.
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">1. Information We Collect</h4>
                <p>When you use FretLearn, we may collect the following information:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300 font-mono">
                  <li><strong>Account Information:</strong> Your email address and basic profile info provided via Google OAuth or Magic Link sign-in.</li>
                  <li><strong>Practice Data:</strong> Your custom instrument setups, practice round accuracy, session durations, and preference settings.</li>
                  <li><strong>Technical Data:</strong> Analytics telemetry (via Google Tag Manager) such as browser type, device type, and page usage.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">2. How We Use Your Data</h4>
                <p>We use collected data solely to:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300 font-mono">
                  <li>Authenticate your account and enable cloud synchronization across devices.</li>
                  <li>Persist your custom instrument tunings, fret ranges, and practice streaks.</li>
                  <li>Analyze aggregate platform usage to improve app responsiveness and features.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">3. Data Storage & Security</h4>
                <p>
                  Your data is stored securely using Supabase infrastructure with encrypted database connections and industry-standard Row Level Security (RLS) policies. Settings are also cached locally in your browser's <code className="font-mono text-cyan-400">localStorage</code> for instant zero-latency loading.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">4. Third-Party Services</h4>
                <p>
                  FretLearn integrates with third-party service providers for authentication and analytics:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300 font-mono">
                  <li><strong>Supabase Auth & Database:</strong> User authentication and cloud data persistence.</li>
                  <li><strong>Google OAuth:</strong> Identity verification for Google Sign-In.</li>
                  <li><strong>Google Tag Manager:</strong> Anonymous usage analytics.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">5. Your Data Rights & Deletion</h4>
                <p>
                  You have the right to request access to or deletion of your account and practice data at any time. To request account deletion or data removal, please contact support or clear your local browser storage.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-cyan-950/40 border border-cyan-900/50 rounded-2xl p-4 text-xs font-mono text-cyan-300 space-y-1">
                <strong className="text-white block font-bold">Terms Summary</strong>
                <p>
                  FretLearn is a free hands-free fretboard training application. By accessing or using the platform, you agree to these Terms of Service.
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">1. Acceptance of Terms</h4>
                <p>
                  By creating an account or using FretLearn, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the application.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">2. Use of Service</h4>
                <p>
                  FretLearn grants you a personal, non-exclusive, non-transferable, revocable license to access and use the platform for educational and musical practice purposes.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">3. User Accounts</h4>
                <p>
                  You are responsible for maintaining the security of your account login credentials. FretLearn is not liable for unauthorized access resulting from compromised credentials.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">4. Prohibited Conduct</h4>
                <p>You agree not to:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300 font-mono">
                  <li>Attempt to gain unauthorized access to service infrastructure or other user accounts.</li>
                  <li>Use automated bots or scrapers to overwhelm service APIs.</li>
                  <li>Reverse engineer or disassemble core application logic.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-white">5. Disclaimer of Warranties</h4>
                <p>
                  FretLearn is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, express or implied. We do not guarantee uninterrupted or error-free operation.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
