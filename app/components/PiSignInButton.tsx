// Location: app/components/PiSignInButton.tsx
'use client';

import React from 'react';
import { usePiAuth } from '@/hooks/usePiAuth';
import { KeyRound, Loader2 } from 'lucide-react';

export default function PiSignInButton() {
  const { authenticate, loading, error } = usePiAuth();

  return (
    <div className="w-full space-y-2 font-mono">
      <button
        onClick={authenticate}
        disabled={loading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.3)]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4" />
            <span>Authenticate via Pi Network</span>
          </>
        )}
      </button>

      {error && <p className="text-[10px] text-red-400 text-center">{error}</p>}
    </div>
  );
}