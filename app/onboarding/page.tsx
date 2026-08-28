// Location: app/onboarding/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, ArrowRight, Loader2, Wallet, RefreshCw } from 'lucide-react';
import { PiAuthGate } from '@/components/PiAuthGate';

export default function OnboardingPage() {
  const { pioneer, login, isHydrated } = useAuth();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [telemetryMsg, setTelemetryMsg] = useState('Initializing MESH Protocol Node...');
  const [isOutsidePiBrowser, setIsOutsidePiBrowser] = useState(false);

  // 1. Safe detection of Pi Browser environment without race conditions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPiEnvironment = () => {
      const isPiUserAgent = /PiBrowser/i.test(navigator.userAgent);
      const hasPiSDK = !!(window as any).Pi;

      if (!isPiUserAgent && !hasPiSDK) {
        setIsOutsidePiBrowser(true);
        setTelemetryMsg('[DETECT] Web Gateway Node detected. OAuth required.');
      } else {
        setIsOutsidePiBrowser(false);
        setTelemetryMsg('[READY] Pi Sandbox active. Awaiting Pioneer signature.');
      }
    };

    // Immediate check + fallback interval to allow script hydration
    checkPiEnvironment();
    const timeout = setTimeout(checkPiEnvironment, 400);

    return () => clearTimeout(timeout);
  }, []);

  // 2. Real Pi SDK Handshake & Verification Hand-off
  const handlePiAuth = async () => {
    setIsAuthenticating(true);
    setTelemetryMsg('[INIT] Engaging Pi SDK sandbox handshake...');

    try {
      if (typeof window === 'undefined' || !(window as any).Pi) {
        throw new Error('Pi SDK not detected. Switch to Web Gateway.');
      }

      const Pi = (window as any).Pi;
      Pi.init({ version: '2.0', sandbox: true });

      const scopes = ['username', 'payments'];
      const onIncompletePaymentFound = (payment: any) => {
        console.warn('[MESH-ONBOARDING] Incomplete payment found:', payment);
      };

      setTelemetryMsg('[AUTH] Awaiting biometric / sandbox approval...');
      const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);

      setTelemetryMsg('[VERIFY] Signature acquired. Pinging serverless callback...');

      // 3. Post to API Route for Pi Core Verification
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authResult.accessToken,
          user: authResult.user,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.warn('[AUTH_WARN] Callback verification notice:', data.error);
      }

      // 4. Commit Pioneer to MESH State
      const verifiedUid = data?.user?.uid || authResult.user.uid;
      const verifiedUser = data?.user?.username || authResult.user.username;

      login({
        uid: verifiedUid,
        username: verifiedUser,
        accessToken: authResult.accessToken,
        tier: 'CITIZEN',
        status: 'ACTIVE',
        trustScore: 100,
      });

      setTelemetryMsg(`[STATUS 200] Pioneer @${verifiedUser} verified. Directing to Academy...`);

      setTimeout(() => {
        router.replace('/academy');
      }, 700);
    } catch (err: any) {
      console.error('[AUTH_FAULT]:', err);
      setTelemetryMsg(`[FAULT] ${err.message || 'Authentication sequence interrupted.'}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 5. Loading placeholder during Context hydration
  if (!isHydrated) {
    return (
      <main className="w-full max-w-[384px] mx-auto min-h-dvh bg-slate-950 text-slate-100 p-4 font-mono flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Hydrating MESH Matrix...</p>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[384px] mx-auto min-h-dvh bg-slate-950 text-slate-100 p-4 font-mono flex flex-col justify-center gap-6">
      <div className="border border-slate-800 bg-slate-900/60 p-5 rounded-2xl flex flex-col gap-4 shadow-xl text-center backdrop-blur-md">
        <div className="flex justify-center">
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl">
            <Shield className="w-9 h-9 text-cyan-400" />
          </div>
        </div>

        <div>
          <h1 className="text-base font-bold uppercase tracking-wider text-slate-100">
            NEO PROTOCOL
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Stage 1: Identity & Node Genesis</p>
        </div>

        {/* Telemetry Window */}
        <div className="p-3 bg-slate-950 border border-slate-800/90 rounded-lg text-left shadow-inner">
          <div className="text-[9px] text-emerald-400 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Terminal Telemetry:
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-mono break-all">
            {telemetryMsg}
          </p>
        </div>

        {/* Conditional Auth Gateway */}
        {isOutsidePiBrowser ? (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl space-y-2 text-left">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Wallet className="w-4 h-4" /> Web Gateway Detected
              </div>
              <p className="text-[11px] text-slate-300">
                Sign in with your Pi Network account using OAuth.
              </p>
            </div>
            <PiAuthGate clientId={process.env.NEXT_PUBLIC_PI_TESTNET_CLIENT_ID || 'FtbUB9fO3zfZZG3cp2SEpEdgzTNEgqpliDl8Q7Jr9Nc'} />
          </div>
        ) : (
          <button
            onClick={handlePiAuth}
            disabled={isAuthenticating}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            {isAuthenticating ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <>
                <span>Authenticate via Pi Network</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}

        {/* Force Retry / Sync Reset Link */}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="text-[9px] text-slate-500 hover:text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1 mt-1 transition"
        >
          <RefreshCw className="w-2.5 h-2.5" /> Flush Local Node RAM
        </button>
      </div>
    </main>
  );
}