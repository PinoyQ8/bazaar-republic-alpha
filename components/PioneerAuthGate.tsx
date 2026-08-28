'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Fingerprint, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';

interface PioneerAuthGateProps {
  children: React.ReactNode;
}

export default function PioneerAuthGate({ children }: PioneerAuthGateProps) {
  const { pioneer, login, isHydrated } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDevBypass = () => {
    const devUid = localStorage.getItem('mesh_pioneer_uid') || 'usr_pioneer_mommydors';
    const devUser = localStorage.getItem('mesh_pioneer_id') || 'PinoyQ8_Dev';

    login({
      uid: devUid,
      username: devUser,
      status: 'ACTIVE',
      tier: 'ACADEMY_CORE' as any,
      trustScore: 100,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('mesh_genesis_cleared', 'true');
      localStorage.setItem('mesh_session_active', 'true');
      localStorage.setItem('mesh_pioneer_active', 'true');
      localStorage.setItem('mesh_pioneer_uid', devUid);
      localStorage.setItem('mesh_master_ts', Date.now().toString());
    }

    setIsVerifying(false);
  };

  useEffect(() => {
    if (!isHydrated) return;

    // Check if session is already active in localStorage or context
    const hasActiveSession =
      pioneer?.isAuthenticated ||
      (typeof window !== 'undefined' &&
        (localStorage.getItem('mesh_session_active') === 'true' ||
          localStorage.getItem('mesh_genesis_cleared') === 'true' ||
          localStorage.getItem('pi_auth_user') !== null));

    if (hasActiveSession) {
      setIsVerifying(false);
      return;
    }

    // Auto-timeout after 2.5s if Pi SDK does not respond on mobile
    timeoutRef.current = setTimeout(() => {
      setShowFallback(true);
    }, 2500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHydrated, pioneer]);

  // Render children immediately once verified
  if (!isVerifying || pioneer?.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <main className="w-full max-w-[384px] mx-auto min-h-dvh bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-mono">
      <div className="flex flex-col items-center gap-4 text-center w-full">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <div className="space-y-1">
          <p className="text-cyan-400 text-xs tracking-wider font-bold flex items-center justify-center gap-2">
            <Fingerprint className="w-4 h-4" /> FORGING MESH IDENTITY...
          </p>
          <p className="text-[10px] text-slate-500">
            Awaiting Pi SDK approval in Pi Browser
          </p>
        </div>

        {/* Fallback Action emerges after 2.5s */}
        {showFallback && (
          <div className="w-full pt-4 space-y-2 animate-fade-in">
            <button
              onClick={handleDevBypass}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Bypass & Enter Mesh Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 hover:text-slate-200"
            >
              <RefreshCw className="w-3 h-3" /> Retry Handshake
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
