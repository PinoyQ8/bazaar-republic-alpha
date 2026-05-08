"use client";

import React, { useState, useEffect, useRef } from 'react';

const ENTRY_FEE = 0.05;
const MAX_ATTEMPTS = 3;
const GRANT_AMOUNT = 50;

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

  const handleLogout = () => {
    console.log("[MESH-SCAN] Terminating Session. Purging Identity...");
    setPioneer(null);
    setTxStatus('IDLE');
  };

  useEffect(() => {
    if (initAttempted.current) return;
    const preHeat = async () => {
      const piNode = (window as any).Pi;
      if (piNode) {
        try {
          await (window as any).Pi.init({ version: "2.0", sandbox: true });
          initAttempted.current = true;
          setTimeout(() => setIsBridgeHot(true), 1500);
        } catch (err) {
          setIsBridgeHot(true); 
        }
      }
    };
    const timer = setInterval(() => {
      if ((window as any).Pi) { preHeat(); clearInterval(timer); }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const handleGenesisOnboarding = async () => {
    if (!isBridgeHot || txStatus === 'PENDING') return;
    try {
      setTxStatus('PENDING');
      const auth = await (window as any).Pi.authenticate(['payments', 'username'], resolveStackedPayment);
      setPioneer(auth.user);

      if (auth.user.username.toLowerCase() === 'pinoyq8') {
        setTxStatus('SUCCESS');
        return;
      }

      const attempts = parseInt(localStorage.getItem('ALPHA_TX_ATTEMPTS') || '0');
      if (attempts >= MAX_ATTEMPTS) { setTxStatus('LOCKED'); return; }
      localStorage.setItem('ALPHA_TX_ATTEMPTS', (attempts + 1).toString());

      await (window as any).Pi.createPayment({
        amount: ENTRY_FEE,
        memo: `Alpha Entry: ${GRANT_AMOUNT} mBZR`,
        metadata: { type: "alpha_onboarding", reward: GRANT_AMOUNT },
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          await fetch("/api/pi/approve", { method: "POST", body: JSON.stringify({ paymentId }) });
        },
        onReadyForServerConfirmation: async (paymentId: string) => {
          localStorage.setItem('ALPHA_TX_ATTEMPTS', '0');
          setTxStatus('SUCCESS');
        },
        onCancelled: () => setTxStatus('IDLE'),
        onError: () => setTxStatus('IDLE')
      });
    } catch (error) { setTxStatus('IDLE'); }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-900 border-2 border-blue-500/20 rounded-2xl shadow-inner max-w-sm mx-auto relative overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full ${isBridgeHot ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          {isBridgeHot ? "Mesh Sync Active" : "Bridge Warming"}
        </span>
      </div>

      <div className="w-full mb-6">
        {txStatus === 'SUCCESS' ? (
          <div className="text-center space-y-2">
            <div className="py-2 px-4 bg-green-500/10 border border-green-500/50 rounded text-green-400 font-mono text-xs">
              PIONEER::{pioneer?.username?.toUpperCase()}
            </div>
            <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">50 mBZR Secured</p>
          </div>
        ) : txStatus === 'LOCKED' ? (
          <div className="py-3 px-6 bg-red-500/20 border border-red-500 text-red-400 rounded text-[10px] font-mono text-center">
            [SECURITY LOCK] MAX ATTEMPTS REACHED.
          </div>
        ) : (
          <button 
            onClick={handleGenesisOnboarding}
            disabled={!isBridgeHot || txStatus === 'PENDING'}
            className={`w-full py-4 font-bold rounded-lg transition-all ${
              isBridgeHot && txStatus !== 'PENDING'
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg' 
                : 'bg-slate-800 text-slate-600'
            }`}
          >
            <span className="text-xs uppercase">
              {txStatus === 'PENDING' ? "Processing..." : "Join Circle of Elders"}
            </span>
          </button>
        )}
      </div>

      {/* 🛡️ GLOBAL LOGOUT GATE - PERSISTENT EXCEPT DURING PENDING */}
      {txStatus !== 'PENDING' && (pioneer || txStatus === 'LOCKED') && (
        <button 
          onClick={handleLogout}
          className="mt-2 text-[9px] text-slate-600 hover:text-red-500 font-mono uppercase tracking-tighter transition-all"
        >
          [ TERMINATE SESSION / SWITCH NODE ]
        </button>
      )}

      {txStatus === 'PENDING' && (
        <div className="text-[9px] text-blue-500 font-mono animate-pulse uppercase mt-2">
          Handshake in Progress...
        </div>
      )}
    </div>
  );
}