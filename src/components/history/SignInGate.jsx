import React from 'react';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function SignInGate({ onOpenAuth, onBack }) {
  return (
    <div className="my-auto flex flex-col items-center text-center py-10 px-4">
      <h2 className="font-display font-extrabold uppercase tracking-[0.15em] text-3xl sm:text-4xl">Track your progress</h2>
      <p className="mt-3 max-w-md opacity-80">
        Sign in to keep every pass / fail round: accuracy over time, your best streaks and the notes you miss most.
        Practising works without an account.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button type="button" onClick={onOpenAuth} className="btn btn-primary btn-lg font-display uppercase tracking-widest">
          <LogIn className="size-5" /> Sign in
        </button>
        <button type="button" onClick={onBack} className="btn btn-lg font-display uppercase tracking-widest">
          <ArrowLeft className="size-5" /> Back
        </button>
      </div>
    </div>
  );
}
