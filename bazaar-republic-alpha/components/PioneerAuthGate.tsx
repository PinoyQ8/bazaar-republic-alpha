'use client';

import React, { useState } from 'react';

interface AuthGateProps {
  onLinkEstablished: (pioneerId: string) => void;
}

export default function PioneerAuthGate({ onLinkEstablished }: AuthGateProps) {
  const [pioneerId, setPioneerId] = useState<string>('');
  const [passkey, setPasskey] = useState<string>('');
  const [status, setStatus] = useState<'IDLE' | 'FORGING' | 'ACTIVE'>('IDLE');

  const handleLinkExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pioneerId || !passkey) return;

    setStatus('FORGING');
    console.log(`🔒 Initiating Secure Link Sequence for Pioneer: ${pioneerId}`);

    // Simulate cryptographic authorization handshake
    setTimeout(() => {
      setStatus('ACTIVE');
      console.log(`✅ Link established safely for node identity mapping.`);
      onLinkEstablished(pioneerId);
    }, 1200);
  };

  return (
    <div className="bg-neutral-950 text-amber-500 p-5 rounded-xl border border-neutral-800 font-mono max-w-90 mx-auto shadow-2xl relative overflow-hidden">
      {/* SCANNING LINES BACKGROUND DECORATION */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-neutral-900/10 to-transparent pointer-events-none animate-pulse" />

      {/* HEADER MATRIX */}
      <div className="border-b border-neutral-800 pb-3 mb-5">
        <h1 className="text-sm font-black tracking-widest text-neutral-200 uppercase">PROJECT BAZAAR</h1>
        <p className="text-[9px] text-neutral-500 uppercase tracking-wider mt-0.5">The MESH Protocol // Node Access</p>
      </div>

      {/* CREDENTIAL VECTOR FORM */}
      <form onSubmit={handleLinkExecution} className="space-y-4 relative z-10">
        {/* PIONEER ID INPUT */}
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1.5 font-bold">
            Pioneer ID
          </label>
          <input
            type="text"
            required
            value={pioneerId}
            onChange={(e) => setPioneerId(e.target.value)}
            placeholder="@username"
            disabled={status !== 'IDLE'}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-xs text-amber-400 font-bold placeholder-neutral-700 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30 transition-all uppercase"
          />
        </div>

        {/* CRYPTOGRAPHIC PASSKEY INPUT */}
        <div>
          <label className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1.5 font-bold">
            Cryptographic Passkey
          </label>
          <input
            type="password"
            required
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="••••••••••••••••••••••••"
            disabled={status !== 'IDLE'}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2.5 text-xs text-amber-400 font-bold tracking-widest placeholder-neutral-700 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30 transition-all"
          />
        </div>

        {/* INTERACTIVE LINK ACTIVATION TRIGGER */}
        <button
          type="submit"
          disabled={status !== 'IDLE'}
          className={`w-full font-bold text-xs py-3 px-4 rounded transition-all duration-300 uppercase tracking-widest shadow-lg ${
            status === 'ACTIVE'
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 shadow-emerald-950/20'
              : status === 'FORGING'
              ? 'bg-neutral-900 text-neutral-500 border border-neutral-800 cursor-wait animate-pulse'
              : 'bg-amber-600 hover:bg-amber-500 text-neutral-950 hover:shadow-amber-500/10 active:scale-[0.98]'
          }`}
        >
          {status === 'ACTIVE' && '✓ LINK ESTABLISHED'}
          {status === 'FORGING' && '[ SYNCHRONIZING ]'}
          {status === 'IDLE' && 'Establish Link'}
        </button>
      </form>
    </div>
  );
}