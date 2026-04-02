'use client';

import React, { useState } from 'react';

const UbumenyiComingSoon: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thanks! We'll notify ${email} when Ubumenyi launches.`);
      setEmail('');
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50/30 font-sans">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20 md:py-32">
        {/* main card container */}
        <div className="w-full max-w-3xl mx-auto text-center">
          {/* logo / brand placeholder - knowledge/academic theme */}
          <div className="mb-8 inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl"></div>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-emerald-100 backdrop-blur-sm md:h-24 md:w-24">
                <svg className="h-10 w-10 text-emerald-700 md:h-12 md:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* headline */}
          <h1 className="text-5xl font-bold tracking-tight text-slate-800 sm:text-6xl md:text-7xl">
            <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
              Ubumenyi
            </span>
          </h1>

          {/* status badge */}
          <div className="mt-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200/50 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              Knowledge platform · Coming soon
            </span>
          </div>

          {/* main message */}
          <div className="mt-12 space-y-6">
          
            <p className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              UBUMENYI Coming Soon.
            </p>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-emerald-200"></div>
            <p className="mx-auto max-w-lg text-base text-slate-500 sm:text-lg">
              Ubumenyi is being crafted to bring learning, insight, and growth to your fingertips. Get ready to explore a world of knowledge.
            </p>
          </div>

          {/* notification form */}
          <div className="mx-auto mt-12 w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 backdrop-blur-sm transition-all"
                aria-label="Email for launch notification"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-medium text-black shadow-sm transition-all hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:scale-[0.98]"
              >
                Notify me
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </button>
            </form>
            {isSubmitted && (
              <p className="mt-3 text-sm text-emerald-600 animate-in fade-in duration-300">
                ✓ Thanks! You'll hear from us soon.
              </p>
            )}
          
          </div>

        </div>
      </div>
    
    </div>
  );
};

export default UbumenyiComingSoon;