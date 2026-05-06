"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// --- TYPE-2 DEFENSE: TYPESCRIPT ADJUDICATOR SHIELD ---
declare global {
  interface Window {
    Pi: any;
  }
}

type MeshPhase = 'GENESIS' | 'OPERATIONAL' | 'INTERCEPT' | 'STASIS';

// =========================================================================
// 1. THE EMBEDDED SHIELD (Fused locally to prevent import crashes)
// =========================================================================
interface GracePeriodProps {
  onAuthorize: () => void;
  onStasis: () => void;
}

function GracePeriodBuffer({ onAuthorize, onStasis }: GracePeriodProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onAuthorize();
      return;
    }
    const timerInterval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerInterval);
  }, [timeLeft, onAuthorize]);

  return (
    <div className="w-full flex flex-col items-center border border-yellow-500/50 bg-black p-6 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.2)]">
      <div className="flex items-center justify-center gap-3 mb-4 text-yellow-500">
        <h2 className="text-xl font-bold uppercase tracking-widest text-center">Interception Shield Active</h2>
      </div>
      <p className="text-gray-400 text-sm text-center mb-6">
        Transaction pending. You have 60 seconds to review the destination address. 
        If you suspect a breach, engage STASIS immediately.
      </p>
      <div className="text-6xl font-black text-yellow-500 mb-8 font-mono tracking-widest">
        00:{timeLeft.toString().padStart(2, '0')}
      </div>
      <div className="w-full grid grid-cols-1 gap-4">
        <button onClick={onAuthorize} className="w-full py-4 bg-green-900 text-green-400 font-bold uppercase rounded border border-green-500">
          Authorize Now
        </button>
        <button onClick={onStasis} className="w-full py-4 bg-red-900 text-white font-black uppercase rounded border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
          Engage Stasis
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// 2. THE MASTER NODE LOGIC
// =========================================================================
export default function RepublicMasterNode() {
  const [currentPhase, setCurrentPhase] = useState<MeshPhase>('GENESIS');
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [citizenUID, setCitizenUID] = useState<string | null>(null);
  const [piWalletAddress, setPiWalletAddress] = useState<string | null>(null);

  // THE HARDWARE LOCK: Prevents Pi SDK Double-Boot Crash
  const sdkInitialized = useRef(false);

  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  useEffect(() => {
    addLog("Vercel Bridge Active. MESH Routing Matrix Online.");
  }, []);

  const executePiHandshake = async () => {
    // ALPHA DEV BYPASS: If on local desktop, force OPERATIONAL phase
    if (typeof window === 'undefined' || !window.Pi) {
      addLog("FOUNDER OVERRIDE: Booting Desktop Diagnostic Mode.");
      setCitizenUID("SYS_ADMIN_X570");
      setPiWalletAddress("DEBUG_WALLET_XYZ");
      setCurrentPhase('OPERATIONAL');
      return;
    }

    try {
      if (!sdkInitialized.current) {
        window.Pi.init({ version: "2.0", sandbox: true });
        sdkInitialized.current = true;
        addLog("Pi SDK Handshake: Sandbox Mode INITIALIZED.");
      }

      addLog("Initiating Pi Core Authentication...");
      const scopes = ['username', 'payments', 'wallet_address'];
      
      const auth = await window.Pi.authenticate(scopes, (incompletePayment: any) => {
        addLog(`Incomplete payment: ${incompletePayment.identifier}`);
      });

      if (auth && auth.user) {
        addLog("Pi Core Auth Success. Token Secured.");
        setCitizenUID(auth.user.uid);
        setPiWalletAddress(auth.user.walletAddress || "PENDING");
        setCurrentPhase('OPERATIONAL');
      }
    } catch (error) {
      addLog("HANDSHAKE REJECTED: Connection Error.");
    }
  };

  const executeFounderReset = () => {
    setCurrentPhase('GENESIS');
    setCitizenUID(null);
    setMeshLogs([`[ALPHA DEV] FOUNDER OVERRIDE: RAM FLUSHED.`]);
  };

  // --- RENDERING PHASES ---
  if (currentPhase === 'GENESIS') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono">
        <div className="w-full max-w-2xl border border-green-800 bg-black p-8 rounded-xl shadow-[0_0_30px_rgba(20,83,45,0.3)] text-center">
          <h1 className="text-3xl font-black text-green-500 uppercase mb-8">Bazaar Republic</h1>
          <button onClick={executePiHandshake} className="w-full py-5 bg-green-900 text-white border border-green-500 font-bold rounded uppercase">
            Connect Pi Wallet
          </button>
          <div className="mt-8 bg-gray-900 p-4 rounded h-32 overflow-y-auto text-xs text-green-400 text-left">
            {meshLogs.map((log, i) => <div key={i}>{">_"} {log}</div>)}
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === 'OPERATIONAL') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4">
        <div className="w-full max-w-2xl border border-green-800 p-8 rounded-xl text-center">
          <h1 className="text-2xl font-bold mb-4 uppercase">NODE OPERATIONAL</h1>
          <p className="mb-2 text-sm text-gray-400">Citizen UID: <span className="text-green-400 font-bold">{citizenUID?.substring(0, 12)}...</span></p>
          
          <button onClick={() => setCurrentPhase('INTERCEPT')} className="w-full py-4 mt-8 bg-yellow-900 text-yellow-500 font-bold border border-yellow-700 uppercase rounded">
            Initiate Transfer (Test Shield)
          </button>
        </div>
        <button onClick={executeFounderReset} className="mt-8 px-6 py-2 border border-red-900 text-red-500 uppercase text-xs">
          Flush RAM & Restart
        </button>
      </div>
    );
  }

  if (currentPhase === 'INTERCEPT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 px-4 font-mono">
        <div className="w-full max-w-2xl">
          <GracePeriodBuffer 
            onAuthorize={() => setCurrentPhase('OPERATIONAL')}
            onStasis={() => setCurrentPhase('STASIS')}
          />
        </div>
      </div>
    );
  }

  if (currentPhase === 'STASIS') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-950 px-4 font-mono text-center">
        <div className="w-full max-w-2xl border-2 border-red-600 bg-black p-8 rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.4)]">
          <h1 className="text-4xl font-black text-red-500 uppercase mb-4">STASIS LOCK ENGAGED</h1>
          <p className="text-gray-300">All outbound transactions frozen at protocol level.</p>
        </div>
        <button onClick={executeFounderReset} className="mt-8 px-6 py-2 border border-red-900 text-red-500 uppercase text-xs">
          Flush RAM
        </button>
      </div>
    );
  }

  return null;
}