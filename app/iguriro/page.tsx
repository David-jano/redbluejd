'use client';

import React, { useState } from 'react';

const EguriroComingSoon: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thanks! We'll notify ${email} when eGURIRO launches.`);
      setEmail('');
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 font-sans">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20 md:py-32">
        {/* main card container - glassmorphism meets clean modern */}
        <div className="w-full max-w-3xl mx-auto text-center">
       

          {/* main message */}
          <div className="mt-12 space-y-6">
            <p className="text-xl font-medium text-slate-700 sm:text-2xl">
              We're crafting something remarkable.
            </p>
            <p className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Available soon.
            </p>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-amber-500"></div>
            <p className="mx-auto max-w-lg text-base text-slate-500 sm:text-lg">
              The eGURIRO experience is almost ready. Be among the first to discover a new way to connect, transact, and grow.
            </p>
          </div>

          {/* notification form - simple modern email capture */}
          <div className="mx-auto mt-12 w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 backdrop-blur-sm transition-all"
                aria-label="Email for launch notification"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3 font-medium text-white shadow-sm transition-all hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98]"
              >
                Notify me
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </button>
            </form>
            {isSubmitted && (
              <p className="mt-3 text-sm text-green-600 animate-in fade-in duration-300">
                 Thanks! You'll hear from us soon.
              </p>
            )}
           
          </div>
        </div>
       
      </div>
    </div>
  );
};

export default EguriroComingSoon;