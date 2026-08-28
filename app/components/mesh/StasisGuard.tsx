'use client';

import React, { useState, useEffect } from 'react';

interface StasisGuardProps {
  stasisEnd: string; // ISO String from our API
  citizenUid: string;
}

export default function StasisGuard({ stasisEnd, citizenUid }: StasisGuardProps) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(stasisEnd).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stasisEnd]);

  if (!timeLeft) return null; // Stasis expired, render nothing (access granted)

  return (
    <div className="fixed inset-0 z-99 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 border-4 border-amber-500/20">
      <div className="w-full max-w-85 bg-zinc-900 border border-amber-500/50 rounded-lg p-8 shadow-[0_0_50px_rgba(245,158,11,0.1)] text-center">
        <div className="mb-6 inline-block p-4 rounded-full bg-amber-500/10 border border-amber-500/30">
          <svg className="w-12 h-12 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-zinc-100 tracking-widest uppercase mb-2">
          Node in Stasis
        </h2>
        <p className="text-xs text-zinc-500 mb-8 font-mono uppercase tracking-tighter">
          Registry ID: {citizenUid}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-8 font-mono">
          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
            <div className="text-2xl font-bold text-amber-500">{String(timeLeft.h).padStart(2, '0')}</div>
            <div className="text-[10px] text-zinc-500 uppercase">HRS</div>
          </div>
          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
            <div className="text-2xl font-bold text-amber-500">{String(timeLeft.m).padStart(2, '0')}</div>
            <div className="text-[10px] text-zinc-500 uppercase">MIN</div>
          </div>
          <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700">
            <div className="text-2xl font-bold text-amber-500">{String(timeLeft.s).padStart(2, '0')}</div>
            <div className="text-[10px] text-zinc-500 uppercase">SEC</div>
          </div>
        </div>

        <div className="text-[10px] leading-relaxed text-zinc-400 font-medium px-2">
          RECOVERY PROTOCOL ACTIVE. THIS TERMINAL IS LOCKED FOR 24 HOURS TO PREVENT UNAUTHORIZED MIGRATION.
        </div>
      </div>
    </div>
  );
}