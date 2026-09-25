import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';

export default function LegalModal({ isOpen, onClose, initialTab = 'privacy' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'privacy' | 'terms'

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  return (
    <Modal open={isOpen} onClose={onClose} labelledBy="legal-title" className="max-w-3xl flex flex-col max-h-[85vh] p-0">
      <header className="flex items-center justify-between px-5 py-3 bg-cabinet border-b-4 border-(--piping)">
        <h2 id="legal-title" className="font-display font-bold uppercase tracking-[0.2em] text-lg">The fine print</h2>
        <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-square" aria-label="Close">
          <X className="size-5" />
        </button>
      </header>

      <div role="tablist" className="tabs tabs-border px-3 border-b border-base-300">
        <button type="button" role="tab" aria-selected={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} className={`tab font-display uppercase tracking-wider ${activeTab === 'privacy' ? 'tab-active' : ''}`}>
          Privacy policy
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'terms'} onClick={() => setActiveTab('terms')} className={`tab font-display uppercase tracking-wider ${activeTab === 'terms' ? 'tab-active' : ''}`}>
          Terms of service
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm leading-relaxed">
          {activeTab === 'privacy' ? (
          <div className="space-y-4">
            <div className="bg-base-200 rounded-box p-4 space-y-1">
              <strong className="block font-display uppercase tracking-wider">Privacy Summary</strong>
              <p>
                FretLearn respects your privacy. We collect minimal data necessary to authenticate your account and synchronize your fretboard practice settings and statistics. We do not sell or share your personal information.
              </p>
            </div>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">1. Information We Collect</h4>
              <p>When you use FretLearn, we may collect the following information:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Information:</strong> Your email address and basic profile info provided via Google OAuth or Magic Link sign-in.</li>
                <li><strong>Practice Data:</strong> Your custom instrument setups, practice round accuracy, session durations, the notes detected for each answer, and preference settings.</li>
                <li><strong>Technical Data:</strong> Analytics telemetry (via Google Tag Manager) such as browser type, device type, and page usage.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">2. How We Use Your Data</h4>
              <p>We use collected data solely to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Authenticate your account and enable cloud synchronization across devices.</li>
                <li>Persist your custom instrument tunings, fret ranges, and practice streaks.</li>
                <li>Analyze aggregate platform usage to improve app responsiveness and features.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">3. Microphone</h4>
              <p>
                If you choose the Mic input, FretLearn listens through your microphone to work out which note you played.
                The audio is analysed in your browser and is never recorded, stored or sent anywhere. If you are signed in,
                only the result (the note name, octave and pitch in hertz) is saved with each practice answer.
                The microphone is only on during a practice round, and you can switch to Voice or Manual input at any time.
              </p>
              <p>
                Voice input is different: it uses your browser&rsquo;s built-in speech recognition. Some browsers, including
                Chrome, send that audio to their maker&rsquo;s speech service to turn it into text. FretLearn only receives the text.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">4. Data Storage & Security</h4>
              <p>
                Your data is stored securely using Supabase infrastructure with encrypted database connections and industry-standard Row Level Security (RLS) policies. Settings are also cached locally in your browser's <code>localStorage</code> for instant zero-latency loading.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">5. Third-Party Services</h4>
              <p>
                FretLearn integrates with third-party service providers for authentication and analytics:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supabase Auth & Database:</strong> User authentication and cloud data persistence.</li>
                <li><strong>Google OAuth:</strong> Identity verification for Google Sign-In.</li>
                <li><strong>Google Tag Manager:</strong> Anonymous usage analytics.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">6. Your Data Rights & Deletion</h4>
              <p>
                You have the right to request access to or deletion of your account and practice data at any time. To request account deletion or data removal, please contact support or clear your local browser storage.
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-base-200 rounded-box p-4 space-y-1">
              <strong className="block font-display uppercase tracking-wider">Terms Summary</strong>
              <p>
                FretLearn is a free, open-source fretboard training application. By accessing or using the platform, you agree to these Terms of Service.
              </p>
            </div>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">1. Acceptance of Terms</h4>
              <p>
                By creating an account or using FretLearn, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the application.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">2. Use of Service</h4>
              <p>
                FretLearn grants you a personal, non-exclusive, non-transferable, revocable license to access and use the platform for educational and musical practice purposes.
              </p>
              <p>
                FretLearn&rsquo;s source code is published under the MIT License, which governs any use of the code itself.
                These terms cover the hosted service at fretlearn.app.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">3. User Accounts</h4>
              <p>
                You are responsible for maintaining the security of your account login credentials. FretLearn is not liable for unauthorized access resulting from compromised credentials.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">4. Prohibited Conduct</h4>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Attempt to gain unauthorized access to service infrastructure or other user accounts.</li>
                <li>Use automated bots or scrapers to overwhelm service APIs.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="font-display font-bold uppercase tracking-wider text-base">5. Disclaimer of Warranties</h4>
              <p>
                FretLearn is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, express or implied. We do not guarantee uninterrupted or error-free operation.
              </p>
            </section>
          </div>
        )}
      </div>

      <footer className="flex justify-end px-5 py-3 border-t border-base-300 bg-base-200">
        <button type="button" onClick={onClose} className="btn font-display uppercase tracking-wider">Close</button>
      </footer>
    </Modal>
  );
}
