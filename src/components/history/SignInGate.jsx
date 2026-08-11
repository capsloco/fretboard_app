import React from 'react';
import { LineChart, LogIn, ArrowLeft } from 'lucide-react';

export default function SignInGate({ onOpenAuth, onBack }) {
  return (
    <div className="my-auto flex flex-col items-center text-center py-8 px-4">
      <div className="card bg-base-100 border border-base-300 shadow-2xl max-w-lg w-full p-8 sm:p-12">
        <div className="card-body items-center p-0">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
            <LineChart className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-base-content mb-3">
            Sign In to Track Your Progress
          </h2>
          <p className="text-base-content/70 max-w-sm text-sm sm:text-base font-medium mb-8">
            Session history, accuracy trends, and note-by-note breakdowns are saved to your account so you can track progress over time.
          </p>

          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAuth}
              className="btn btn-primary btn-lg font-black uppercase tracking-wider w-full sm:w-auto shadow-xl"
            >
              <LogIn className="w-5 h-5" /> Sign In
            </button>
            <button
              onClick={onBack}
              className="btn btn-ghost border border-base-300 hover:bg-base-200 text-base-content btn-lg font-bold w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
