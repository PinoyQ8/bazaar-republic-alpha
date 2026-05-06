"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GracePeriodBuffer from './components/GracePeriodBuffer'; // Keep this import
import Image from 'next/image'; // For your mBZR icon

// --- TYPE-2 DEFENSE: TYPESCRIPT ADJUDICATOR SHIELD ---
declare global {
  interface Window {
    Pi: any; // Bypasses TS strict mode for the external Pi SDK
  }
}

type MeshPhase = 'GENESIS' | 'OPERATIONAL' | 'INTERCEPT' | 'STASIS';

export default function RepublicMasterNode() {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<MeshPhase>('GENESIS');
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [citizenUID, setCitizenUID] = useState<string | null>(null);

  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  // --- THE INIT CIRCUIT ---
  useEffect(() => {
    addLog("Vercel Bridge Active. MESH Routing Matrix Online.");
    
    // Attempt to initialize the Pi SDK if the script loaded
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        window.Pi.init({ version: "2.0", sandbox: true });
        addLog("Pi SDK Handshake: Sandbox Mode INITIALIZED.");
      } catch (err) {
        addLog("ADJUDICATOR ERROR: Pi SDK Initialization Failed.");
      }
    } else {
      addLog("WARNING: Pi Browser environment not detected. Running standard node.");
    }
  }, []);

  // --- THE GLOBAL HANDSHAKE (BETA FORGE) ---
  const executePiHandshake = async () => {
    if (typeof window === 'undefined' || !window.Pi) {
      addLog("ACCESS DENIED: You must access this node via the Pi Browser.");
      return;
    }

    try {
      addLog("Initiating Zero-Knowledge Auth...");
      
      const scopes = ['username', 'payments', 'wallet_address'];
      
      // The core Pi Network Authentication Promise
      const auth = await window.Pi.authenticate(scopes, (incompletePayment: any) => {
        addLog(`Incomplete payment detected: ${incompletePayment.identifier}`);
      });

      if (auth && auth.user) {
        setCitizenUID(auth.user.uid);
        addLog(`HANDSHAKE ACCEPTED. UID: ${auth.user.uid.substring(0, 8)}...`);
        setCurrentPhase('OPERATIONAL');
      }
    } catch (error) {
      addLog("HANDSHAKE REJECTED: Connection severed by Pioneer or SDK.");
      console.error("MESH Error:", error);
    }
  };

  // --- ALPHA DEV TOOL: FOUNDER RESET LOGIC ---
  const executeFounderReset = () => {
    setCurrentPhase('GENESIS');
    setCitizenUID(null);
    setMeshLogs([`[${new Date().toLocaleTimeString()}] [ALPHA DEV] FOUNDER OVERRIDE TRIGGERED. RAM FLUSHED.`]);
  };

  // --- PHASE 1: GENESIS ROUTING (NEW PI AUTH UI) ---
  if (currentPhase === 'GENESIS') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono overflow-x-hidden relative">
        <div className="w-full max-w-2xl border border-green-800 bg-black p-8 rounded-xl flex flex-col items-center shadow-[0_0_30px_rgba(20,83,45,0.3)]">
          
          {/* Logo Integration */}
          <div className="mb-6 relative w-24 h-24">
            <Image src="/bazaar-logo.png" alt="Bazaar Republic" fill className="object-contain" />
          </div>

          <h1 className="text-3xl font-black text-green-500 uppercase tracking-widest text-center mb-2">Bazaar Republic</h1>
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-8 text-center">Type-2 Defense Node</p>

          <button 
            onClick={executePiHandshake}
            className="w-full py-5 bg-green-900 hover:bg-green-800 text-white border-2 border-green-500 font-extrabold text-xl tracking-widest rounded transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-4 uppercase"
          >
            <Image src="/mBZR_icon.png" alt="mBZR" width={24} height={24} />
            Connect Pi Wallet
          </button>

          {/* MESH Terminal Output */}
          <div className="mt-8 w-full bg-gray-900 p-4 rounded h-32 overflow-y-auto border border-gray-700 text-xs text-green-400 font-mono">
            {meshLogs.map((log, index) => (
               <div key={index} className="mb-1">{">_"} {log}</div>
            ))}
          </div>

        </div>
        <FounderResetButton onReset={executeFounderReset} />
      </div>
    );
  }
  // ... [KEEP YOUR EXISTING `INTERCEPT`, `OPERATIONAL`, AND `STASIS` CODE EXACTLY THE SAME BELOW THIS LINE] ...

  if (currentPhase === 'INTERCEPT') {
    return (
      <div className="relative w-full min-h-screen">
        <GracePeriodBuffer 
          abortFreeze={() => {
            addLog("Freeze Aborted. Node returning to Operational State.");
            setCurrentPhase('OPERATIONAL');
          }}
          executeImmediateLock={() => {
            addLog("OVERRIDE ACCEPTED: Executing multi-sig rejection.");
            setCurrentPhase('STASIS');
          }}
        />
        <FounderResetButton onReset={executeFounderReset} />
      </div>
    );
  }

  // --- VIEWPORT RENDERING (OPERATIONAL & STASIS STATES) ---
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono overflow-x-hidden relative">
      <div className={`w-full max-w-2xl border p-8 rounded-xl flex flex-col items-center shadow-lg transition-colors duration-500 ${
        currentPhase === 'STASIS' 
          ? 'bg-red-950 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.4)]' 
          : 'bg-black border-green-800 shadow-[0_0_30px_rgba(20,83,45,0.3)]'
      }`}>
        
        {/* Header Dashboard */}
        <div className={`text-center mb-8 w-full border-b pb-4 ${currentPhase === 'STASIS' ? 'border-red-800' : 'border-green-900'}`}>
          <h1 className={`font-black tracking-widest uppercase text-3xl ${currentPhase === 'STASIS' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
            Bazaar Republic
          </h1>
          <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">
            {currentPhase === 'STASIS' ? 'TYPE-2 DEFENSE: STASIS LOCK ACTIVE' : 'E-NETWORK: NODE OPERATIONAL'}
          </p>
        </div>

        {/* The Node Status Display */}
        <div className={`w-full p-6 text-center rounded border mb-8 ${
          currentPhase === 'STASIS' 
            ? 'bg-black border-red-700 text-red-300' 
            : 'bg-gray-900 border-green-700 text-green-400'
        }`}>
          <h2 className="text-xl font-bold uppercase tracking-widest mb-2">
            Ledger Status
          </h2>
          <p className="text-sm">
            {currentPhase === 'STASIS' 
              ? "All outbound cryptographic signatures are currently rejected by the Vercel Bridge. Your assets are mathematically frozen." 
              : "Multi-Sig parameters are healthy. Node is ready for E-Network interactions."}
          </p>
        </div>

        {/* Execution Commands */}
        <div className="w-full">
          {currentPhase === 'OPERATIONAL' ? (
            <button 
              onClick={() => {
                addLog("Pioneer triggered Self-Freeze. Routing to Interception Shield...");
                setCurrentPhase('INTERCEPT');
              }}
              className="w-full py-5 bg-red-900 hover:bg-red-800 text-white border border-red-600 font-extrabold text-xl tracking-widest rounded transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] uppercase"
            >
              Initiate Self-Freeze
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <button 
                disabled
                className="w-full py-4 bg-black text-red-700 border-2 border-red-900 font-extrabold text-lg tracking-widest rounded cursor-not-allowed uppercase"
              >
                Stasis Protocol Engaged
              </button>
              
              {/* ADJUDICATOR FIX: The Escape Vector */}
              <button 
                onClick={() => router.push('/recovery')}
                className="w-full py-5 bg-transparent border border-blue-600 text-blue-400 hover:bg-blue-900/30 hover:text-white font-black text-xl tracking-widest rounded transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] uppercase"
              >
                Initiate Recovery Bridge
              </button>
            </div>
          )}
        </div>

        {/* MESH Terminal Output */}
        <div className="mt-8 w-full bg-black p-3 rounded h-32 overflow-y-auto border border-gray-800 text-[11px] text-gray-500">
          {meshLogs.map((log, index) => (
             <div key={index} className="mb-1">{log}</div>
          ))}
        </div>

      </div>

      {/* ALPHA DEV TOOL INJECTION */}
      <FounderResetButton onReset={executeFounderReset} />
    </div>
  );
}

// --- SUB-COMPONENT: FLOATING DEV TOOL ---
function FounderResetButton({ onReset }: { onReset: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={onReset}
        className="px-3 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-600 text-gray-400 text-[10px] font-mono uppercase tracking-widest hover:text-white hover:border-white transition-all rounded shadow-lg"
      >
        [ F-Reset ]
      </button>
    </div>
  );
}