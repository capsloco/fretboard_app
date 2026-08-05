import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'privacy' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'privacy' | 'terms'

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="modal modal-open bg-base-900/80 backdrop-blur-md z-[100]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-box w-full max-w-3xl bg-base-100 border border-base-300 shadow-2xl p-6 sm:p-8 space-y-6 text-base-content max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-200 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">Legal & Compliance</h3>
              <p className="text-xs font-mono text-base-content/70">FretLearn Policies & Guidelines</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle font-bold"
            aria-label="Close Legal Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-base-200 rounded-2xl border border-base-300 shrink-0 text-xs font-mono">
          <button
            onClick={() => setActiveTab('privacy')}
            className={activeTab === 'privacy' ? 'btn btn-xs btn-primary font-bold flex items-center justify-center gap-2' : 'btn btn-xs btn-ghost font-bold flex items-center justify-center gap-2'}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={activeTab === 'terms' ? 'btn btn-xs btn-primary font-bold flex items-center justify-center gap-2' : 'btn btn-xs btn-ghost font-bold flex items-center justify-center gap-2'}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 text-sm leading-relaxed text-base-content pr-2 font-sans">
          {activeTab === 'privacy' ? (
            <div className="space-y-4">
              <div className="bg-base-200 border border-base-300 rounded-2xl p-4 text-xs font-mono text-base-content/80 space-y-1">
                <strong className="text-base-content block font-bold">Privacy Summary</strong>
                <p>
                  FretLearn respects your privacy. We collect minimal data necessary to authenticate your account and synchronize your fretboard practice settings and statistics. We do not sell or share your personal information.
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">1. Information We Collect</h4>
                <p>When you use FretLearn, we may collect the following information:</p>
                <ul className="space-y-1 text-xs text-base-content/70 font-mono pl-2">
                  <li><strong>Account Information:</strong> Your email address and basic profile info provided via Google OAuth or Magic Link sign-in.</li>
                  <li><strong>Practice Data:</strong> Your custom instrument setups, practice round accuracy, session durations, and preference settings.</li>
                  <li><strong>Technical Data:</strong> Analytics telemetry (via Google Tag Manager) such as browser type, device type, and page usage.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">2. How We Use Your Data</h4>
                <p>We use collected data solely to:</p>
                <ul className="space-y-1 text-xs text-base-content/70 font-mono pl-2">
                  <li>Authenticate your account and enable cloud synchronization across devices.</li>
                  <li>Persist your custom instrument tunings, fret ranges, and practice streaks.</li>
                  <li>Analyze aggregate platform usage to improve app responsiveness and features.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">3. Data Storage & Security</h4>
                <p>
                  Your data is stored securely using Supabase infrastructure with encrypted database connections and industry-standard Row Level Security (RLS) policies. Settings are also cached locally in your browser's <code className="font-mono text-primary">localStorage</code> for instant zero-latency loading.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">4. Third-Party Services</h4>
                <p>
                  FretLearn integrates with third-party service providers for authentication and analytics:
                </p>
                <ul className="space-y-1 text-xs text-base-content/70 font-mono pl-2">
                  <li><strong>Supabase Auth & Database:</strong> User authentication and cloud data persistence.</li>
                  <li><strong>Google OAuth:</strong> Identity verification for Google Sign-In.</li>
                  <li><strong>Google Tag Manager:</strong> Anonymous usage analytics.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">5. Your Data Rights & Deletion</h4>
                <p>
                  You have the right to request access to or deletion of your account and practice data at any time. To request account deletion or data removal, please contact support or clear your local browser storage.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-base-200 border border-base-300 rounded-2xl p-4 text-xs font-mono text-base-content/80 space-y-1">
                <strong className="text-base-content block font-bold">Terms Summary</strong>
                <p>
                  FretLearn is a free hands-free fretboard training application. By accessing or using the platform, you agree to these Terms of Service.
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">1. Acceptance of Terms</h4>
                <p>
                  By creating an account or using FretLearn, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the application.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">2. Use of Service</h4>
                <p>
                  FretLearn grants you a personal, non-exclusive, non-transferable, revocable license to access and use the platform for educational and musical practice purposes.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">3. User Accounts</h4>
                <p>
                  You are responsible for maintaining the security of your account login credentials. FretLearn is not liable for unauthorized access resulting from compromised credentials.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">4. Prohibited Conduct</h4>
                <p>You agree not to:</p>
                <ul className="space-y-1 text-xs text-base-content/70 font-mono pl-2">
                  <li>Attempt to gain unauthorized access to service infrastructure or other user accounts.</li>
                  <li>Use automated bots or scrapers to overwhelm service APIs.</li>
                  <li>Reverse engineer or disassemble core application logic.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-base font-bold text-base-content">5. Disclaimer of Warranties</h4>
                <p>
                  FretLearn is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, express or implied. We do not guarantee uninterrupted or error-free operation.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-base-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="btn btn-ghost border border-base-300 font-bold text-xs uppercase text-base-content hover:bg-base-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
