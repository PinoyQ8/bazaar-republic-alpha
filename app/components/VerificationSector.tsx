"use client";

import React, { useState, useEffect, useRef } from 'react';

// 🛡️ CONSTANTS
const ENTRY_FEE = 0.05;
const MAX_ATTEMPTS = 3;
const GRANT_AMOUNT = 50;

// Explicitly defining the Status types to prevent "No Overlap" errors
type BridgeStatus = 'IDLE' | 'PENDING' | 'SUCCESS' | 'LOCKED';

export default function VerificationSector() {
  const [isBridgeHot, setIsBridgeHot] = useState(false);
  const [pioneer, setPioneer] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<BridgeStatus>('IDLE');
  const initAttempted = useRef(false);

  const resolveStackedPayment = async (paymentId: string) => {
    console.warn("[MESH-SCAN] Stacked payment detected. Purging:", paymentId);
    await fetch("/api/pi/incomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
  };

  useEffect(() => {
    if (initAttempted.current) return;

    const preHeat = async () => {
      const piNode = (window as any).Pi;
      if (piNode) {
        try {
          console.log("[MESH-SCAN] Pre-heating Bridge...");
          await (window as any).Pi.init({ version: "2.0", sandbox: true });
          initAttempted.current = true;
          setTimeout(() => setIsBridgeHot(true), 1500);
        } catch (err) {
          console.warn("[MESH-SCAN] Warm-up skipped:", err);
          setIsBridgeHot(true); 
        }
      }
    };

    const timer = setInterval(() => {
      if ((window as any).Pi) {
        preHeat();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const handleGenesisOnboarding = async () => {
    if (!isBridgeHot || txStatus === 'PENDING') return;

    const attempts = parseInt(localStorage.getItem('ALPHA_TX_ATTEMPTS') || '0');
    if (attempts >= MAX_ATTEMPTS) {
      setTxStatus('LOCKED');
      return;
    }

    try {
      setTxStatus('PENDING');
      
      const auth = await (window as any).Pi.authenticate(
        ['payments', 'username'], 
        resolveStackedPayment 
      );
      setPioneer(auth.user);

      localStorage.setItem('ALPHA_TX_ATTEMPTS', (attempts + 1).toString());

      await (window as any).Pi.createPayment({
        amount: ENTRY_FEE,
        memo: `Alpha Entry: ${GRANT_AMOUNT} mBZR Grant`,
        metadata: { type: "alpha_onboarding", reward: GRANT_AMOUNT },
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },
        onReadyForServerConfirmation: async (paymentId: string) => {
          localStorage.setItem('ALPHA_TX_ATTEMPTS', '0');
          setTxStatus('SUCCESS');
        },
        onCancelled: () => setTxStatus('IDLE'),
        onError: (err: any) => {
          console.error("Payment Error:", err);
          setTxStatus('IDLE');
        }
      });

    } catch (error) {
      console.error("[MESH-SCAN] Handshake Fracture:", error);
      setTxStatus('IDLE');
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-900 border-2 border-blue-500/20 rounded-2xl shadow-inner max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full animate-pulse ${isBridgeHot ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          {isBridgeHot ? "Mesh Sync Active" : "Bridge Warming"}
        </span>
      </div>

      {txStatus === 'SUCCESS' ? (
        <div className="text-center space-y-3">
          <div className="py-2 px-4 bg-green-500/10 border border-green-500/50 rounded text-green-400 font-mono text-sm">
            WELCOME ELITE::{pioneer?.username?.toUpperCase()}
          </div>
          <p className="text-xs text-slate-400 font-mono">50 mBZR CREDITED</p>
        </div>
      ) : txStatus === 'LOCKED' ? (
        <div className="py-3 px-6 bg-red-500/20 border border-red-500 text-red-400 rounded text-xs font-mono text-center">
          [SECURITY LOCK] MAX ATTEMPTS REACHED.
        </div>
      ) : (
        <button 
          onClick={handleGenesisOnboarding}
          disabled={!isBridgeHot || txStatus === 'PENDING'}
          className={`relative w-full py-4 font-bold rounded-lg transition-all group ${
            isBridgeHot && txStatus !== 'PENDING'
              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'bg-slate-800 text-slate-600'
          }`}
        >
          <span className="relative z-10 flex flex-col items-center">
            <span className="text-sm uppercase tracking-tighter">
              {txStatus === 'PENDING' ? "Processing..." : "Join Circle of Elders"}
            </span>
            {isBridgeHot && txStatus !== 'PENDING' && (
              <span className="text-[9px] font-mono opacity-60">FEE: {ENTRY_FEE} TEST-PI</span>
            )}
          </span>
        </button>
      )}

      {txStatus === 'PENDING' && (
        <div className="mt-4 text-[10px] text-blue-400 font-mono animate-pulse">
          RESOLVING BRIDGE...
        </div>
      )}
    </div>
  );
}