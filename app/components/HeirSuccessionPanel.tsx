// Location: app/components/HeirSuccessionPanel.tsx
'use client';

import React, { useState } from 'react';
import { ShieldAlert, UserCheck, Clock, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react';

interface HeirSuccessionProps {
  founderAddress: string;
  isFounder: boolean;
}

export default function HeirSuccessionPanel({ founderAddress, isFounder }: HeirSuccessionProps) {
  const [lastCheckIn, setLastCheckIn] = useState<string>(new Date().toISOString());
  const [isPinging, setIsPinging] = useState(false);
  const [successionTriggered, setSuccessionTriggered] = useState(false);
  const [designatedHeirs, setDesignatedHeirs] = useState<string[]>([
    'GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3',
    'GD7XBZ6YRE5BXM73O7N2Z...',
  ]);

  // Simulate Founder Heartbeat Ping (Resets Inactivity Timer)
  const handleFounderPing = async () => {
    setIsPinging(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setLastCheckIn(new Date().toISOString());
      setSuccessionTriggered(false);
    } catch (err) {
      console.error('[HEIR-SUCCESSION] Ping failed:', err);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold text-white tracking-wider uppercase">
            Heir Succession Protocol
          </h2>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
          90-Day Switch
        </span>
      </div>

      {/* Status Telemetry */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-neutral-500 block uppercase">Root Founder</span>
          <span className="text-[11px] text-zinc-300 truncate block font-sans">
            {founderAddress ? `${founderAddress.slice(0, 6)}...${founderAddress.slice(-4)}` : 'Not Connected'}
          </span>
        </div>
        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-neutral-500 block uppercase">Inactivity Status</span>
          <span className={`text-[11px] font-bold flex items-center gap-1 ${successionTriggered ? 'text-rose-400' : 'text-emerald-400'}`}>
            <Clock size={12} /> {successionTriggered ? 'Grace Period' : 'Healthy (Active)'}
          </span>
        </div>
      </div>

      {/* Designated Trustee Quorum */}
      <div className="space-y-2">
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
          Designated Trustee Quorum (2-of-3 Multisig)
        </span>
        <div className="space-y-1.5">
          {designatedHeirs.map((heir, index) => (
            <div key={index} className="flex items-center justify-between bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-800 text-[10px]">
              <span className="text-neutral-300 font-sans">{heir}</span>
              <span className="text-cyan-400 font-bold">Trustee #{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Founder Action Panel */}
      {isFounder && (
        <div className="space-y-2 pt-2 border-t border-neutral-800">
          <button
            onClick={handleFounderPing}
            disabled={isPinging}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
          >
            {isPinging ? (
              <>
                <RefreshCw size={14} className="animate-spin text-slate-950" />
                Broadcasting Heartbeat...
              </>
            ) : (
              <>
                <UserCheck size={14} />
                <span>Transmit Founder Heartbeat (Ping)</span>
              </>
            )}
          </button>
          <p className="text-[9px] text-neutral-500 text-center">
            Pinging resets the 90-day inactivity timer and automatically aborts any active grace-period warnings.
          </p>
        </div>
      )}
    </div>
  );
}