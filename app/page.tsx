"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ADJUDICATOR FIX: Import the router
import GenesisLockOnboarding from './components/GenesisLockOnboarding';
import GracePeriodBuffer from './components/GracePeriodBuffer';

type MeshPhase = 'GENESIS' | 'OPERATIONAL' | 'INTERCEPT' | 'STASIS';

export default function RepublicMasterNode() {
  const router = useRouter(); // Initialize the router
  // ... rest of your state (currentPhase, meshLogs, etc.)
  const [currentPhase, setCurrentPhase] = useState<MeshPhase>('GENESIS');
  const [meshLogs, setMeshLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  useEffect(() => {
    addLog("Vercel Bridge Active. MESH Routing Matrix Online.");
  }, []);

  // --- ALPHA DEV TOOL: FOUNDER RESET LOGIC ---
  const executeFounderReset = () => {
    setCurrentPhase('GENESIS');
    setMeshLogs([`[${new Date().toLocaleTimeString()}] [ALPHA DEV] FOUNDER OVERRIDE TRIGGERED. RAM FLUSHED.`]);
  };

  // --- PHASE ROUTING ENGINE ---
  if (currentPhase === 'GENESIS') {
    return (
      <div className="relative w-full min-h-screen">
        <GenesisLockOnboarding 
          onVaultSecured={() => {
            addLog("Republic Vault Key mathematically secured.");
            setCurrentPhase('OPERATIONAL');
          }} 
        />
        <FounderResetButton onReset={executeFounderReset} />
      </div>
    );
  }

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