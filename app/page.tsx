"use client";

import { useState, useEffect } from 'react';
import GenesisLockOnboarding from './components/GenesisLockOnboarding';
import GracePeriodBuffer from './components/GracePeriodBuffer';

// --- MESH STATE TYPING ---
type MeshPhase = 'GENESIS' | 'OPERATIONAL' | 'INTERCEPT' | 'STASIS';

export default function RepublicMasterNode() {
  // --- MASTER MEMORY ---
  // Defaulting to GENESIS for the Alpha Demo to show the full PCT workflow.
  const [currentPhase, setCurrentPhase] = useState<MeshPhase>('GENESIS');
  const [meshLogs, setMeshLogs] = useState<string[]>([]);

  // --- TERMINAL LOGGING ---
  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  useEffect(() => {
    addLog("Vercel Bridge Active. MESH Routing Matrix Online.");
  }, []);

  // --- PHASE ROUTING ENGINE ---

  // PHASE 0: The Initialization (24-Word Forge)
  if (currentPhase === 'GENESIS') {
    return (
      <GenesisLockOnboarding 
        onVaultSecured={() => {
          addLog("Republic Vault Key mathematically secured.");
          setCurrentPhase('OPERATIONAL');
        }} 
      />
    );
  }

  // PHASE 2: The Interception Shield (60s Countdown)
  if (currentPhase === 'INTERCEPT') {
    return (
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
    );
  }

  // --- VIEWPORT RENDERING (OPERATIONAL & STASIS STATES) ---
  // Phases 1 and 3 are handled directly on the master dashboard viewport.
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono">
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
            <button 
              disabled
              className="w-full py-5 bg-black text-red-700 border-2 border-red-900 font-extrabold text-xl tracking-widest rounded cursor-not-allowed uppercase"
            >
              Stasis Protocol Engaged
            </button>
          )}
        </div>

        {/* MESH Terminal Output */}
        <div className="mt-8 w-full bg-black p-3 rounded h-32 overflow-y-auto border border-gray-800 text-[11px] text-gray-500">
          {meshLogs.map((log, index) => (
             <div key={index} className="mb-1">{log}</div>
          ))}
        </div>

      </div>
    </div>
  );
}