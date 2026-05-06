"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GracePeriodBuffer from './components/GracePeriodBuffer';
import Image from 'next/image';

// --- TYPE-2 DEFENSE: TYPESCRIPT ADJUDICATOR SHIELD ---
declare global {
  interface Window {
    Pi: any; 
    __PI_INITIALIZED__: boolean; 
  }
}

type MeshPhase = 'GENESIS' | 'OPERATIONAL' | 'INTERCEPT' | 'STASIS';

export default function RepublicMasterNode() {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<MeshPhase>('GENESIS');
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  
  // DATA INJECTION: The Vault State Buffers
  const [citizenUID, setCitizenUID] = useState<string | null>(null);
  const [citizenUsername, setCitizenUsername] = useState<string | null>(null); 
  const [defenseStatus, setDefenseStatus] = useState<string>("UNKNOWN");

  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  // --- THE INIT CIRCUIT ---
  useEffect(() => {
    addLog("Vercel Bridge Active. MESH Routing Matrix Online.");
    
    if (typeof window !== 'undefined' && window.Pi) {
      if (!window.__PI_INITIALIZED__) {
        try {
          window.Pi.init({ version: "2.0", sandbox: true });
          window.__PI_INITIALIZED__ = true;
          addLog("Pi SDK Handshake: Sandbox Mode INITIALIZED.");
        } catch (err) {
          addLog("ADJUDICATOR ERROR: Pi SDK Initialization Failed.");
        }
      }
    } else {
      addLog("WARNING: Pi Browser environment not detected. Running standard node.");
    }
  }, []);

  // --- THE GLOBAL HANDSHAKE PROTOCOL ---
  const igniteHandshake = async () => {
    try {
      addLog("Initiating Pi Core Authentication...");
      
      const scopes = ['username'];
      const onIncompletePaymentFound = (payment: any) => { };
      
      const authResults = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      const uid = authResults.user.uid;
      const username = authResults.user.username;
      
      addLog(`Pi Core Auth Success. UID Captured.`);

      addLog("Pinging Type-2 Defense Vault...");
      const vaultResponse = await fetch('/api/sync-citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: uid, username: username })
      });

      const vaultData = await vaultResponse.json();

      if (vaultResponse.ok && vaultData.mesh_status === "SUCCESS") {
        // STATE INJECTION: Locking data to the RAM
        setCitizenUID(uid);
        setCitizenUsername(username); 
        setDefenseStatus(vaultData.defense_status);
        
        if (vaultData.is_new_citizen) {
           addLog(`Welcome to the Republic, Pioneer. Profile Minted.`);
           setCurrentPhase('OPERATIONAL'); 
        } else {
           addLog(`Welcome back. Status: [${vaultData.defense_status}]`);
           if (vaultData.defense_status === 'STASIS') {
               setCurrentPhase('STASIS'); 
           } else {
               setCurrentPhase('OPERATIONAL'); 
           }
        }
      }
    } catch (error) {
      addLog("Handshake Failed. User rejected or Sandbox error.");
      console.error(error);
    }
  };

  // --- TYPE-2 DEFENSE: STATE TOGGLE PROTOCOL (THE DATABASE FORGE) ---
  const executeDefenseShift = async (targetState: 'STASIS' | 'OPERATIONAL') => {
    if (!citizenUID) return;
    
    try {
      addLog(`Commanding Neon Vault: Shift to [${targetState}]...`);
      
      const response = await fetch('/api/toggle-defense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: citizenUID, target_status: targetState })
      });

      const data = await response.json();

      if (response.ok && data.mesh_status === "SUCCESS") {
        setDefenseStatus(targetState);
        setCurrentPhase(targetState);
        addLog(`Vault Confirmed: Multi-Sig mathematically locked to ${targetState}.`);
      } else {
        addLog(`ADJUDICATOR ERROR: Vault rejected the state shift.`);
      }
    } catch (error) {
      addLog("Network fracture during state shift.");
    }
  };

  // --- ALPHA DEV TOOL: FOUNDER RESET LOGIC ---
  const executeFounderReset = () => {
    setCurrentPhase('GENESIS');
    setCitizenUID(null);
    setCitizenUsername(null);
    setMeshLogs([`[${new Date().toLocaleTimeString()}] [ALPHA DEV] FOUNDER OVERRIDE TRIGGERED. RAM FLUSHED.`]);
  };

  // --- PHASE 1: GENESIS ROUTING ---
  if (currentPhase === 'GENESIS') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono overflow-x-hidden relative">
        <div className="w-full max-w-2xl border border-green-800 bg-black p-8 rounded-xl flex flex-col items-center shadow-[0_0_30px_rgba(20,83,45,0.3)]">
          
          <div className="mb-6 relative w-24 h-24">
            <Image 
              src="/bazaar-logo.png" 
              alt="Bazaar Republic" 
              fill 
              sizes="96px"
              className="object-contain" 
            />
          </div>

          <h1 className="text-3xl font-black text-green-500 uppercase tracking-widest text-center mb-2">Bazaar Republic</h1>
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-8 text-center">Type-2 Defense Node</p>

          <button 
            onClick={igniteHandshake}
            className="w-full py-5 bg-green-900 hover:bg-green-800 text-white border-2 border-green-500 font-extrabold text-xl tracking-widest rounded transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-4 uppercase"
          >
            <Image src="/mBZR_icon.png" alt="mBZR" width={24} height={24} />
            Connect Pi Wallet
          </button>

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

  // --- PHASE 2: INTERCEPT ROUTING ---
  if (currentPhase === 'INTERCEPT') {
    return (
      <div className="relative w-full min-h-screen">
        <GracePeriodBuffer 
          abortFreeze={() => {
            addLog("Freeze Aborted. Node returning to Operational State.");
            setCurrentPhase('OPERATIONAL');
          }}
          executeImmediateLock={() => {
            addLog("OVERRIDE ACCEPTED: Executing multi-sig rejection sequence...");
            executeDefenseShift('STASIS'); // The physical database trigger
          }}
        />
        <FounderResetButton onReset={executeFounderReset} />
      </div>
    );
  }

  // --- PHASE 3 & 4: VIEWPORT RENDERING (OPERATIONAL & STASIS STATES) ---
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono overflow-x-hidden relative">
      <div className={`w-full max-w-2xl border p-8 rounded-xl flex flex-col items-center shadow-lg transition-colors duration-500 ${
        currentPhase === 'STASIS' 
          ? 'bg-red-950 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.4)]' 
          : 'bg-black border-green-800 shadow-[0_0_30px_rgba(20,83,45,0.3)]'
      }`}>
        
        {/* Header Dashboard */}
        <div className={`text-center mb-6 w-full border-b pb-4 ${currentPhase === 'STASIS' ? 'border-red-800' : 'border-green-900'}`}>
          <h1 className={`font-black tracking-widest uppercase text-3xl ${currentPhase === 'STASIS' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
            Bazaar Republic
          </h1>
          <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">
            {currentPhase === 'STASIS' ? 'TYPE-2 DEFENSE: STASIS LOCK ACTIVE' : 'E-NETWORK: NODE OPERATIONAL'}
          </p>
        </div>

        {/* --- NEW: VAULT IDENTITY PANEL --- */}
        <div className={`w-full p-4 rounded border mb-6 text-left ${currentPhase === 'STASIS' ? 'bg-red-950/30 border-red-800' : 'bg-gray-900 border-green-800'}`}>
          <h3 className={`font-bold uppercase tracking-widest text-xs border-b pb-2 mb-3 ${currentPhase === 'STASIS' ? 'text-red-500 border-red-900' : 'text-green-500 border-gray-800'}`}>
            Type-2 Vault Identity
          </h3>
          
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Pioneer:</span>
            <span className={`font-mono ${currentPhase === 'STASIS' ? 'text-red-400' : 'text-green-400'}`}>
              @{citizenUsername || "PENDING"}
            </span>
          </div>
          
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Vault UID:</span>
            <span className="text-gray-400 font-mono text-xs">
              {citizenUID ? `${citizenUID.substring(0, 13)}...` : "AWAITING_SYNC"}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Defense State:</span>
            <span className={`font-mono font-black ${currentPhase === 'STASIS' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
              [{defenseStatus}]
            </span>
          </div>
        </div>

        {/* The Node Status Display */}
        <div className={`w-full p-6 text-center rounded border mb-8 ${
          currentPhase === 'STASIS' 
            ? 'bg-black border-red-700 text-red-300' 
            : 'bg-black border-green-700 text-green-400'
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
              
              {/* ADJUDICATOR FIX: Alpha Unfreeze Override */}
              <button 
                onClick={() => {
                  addLog("Initiating Alpha Override: Unfreezing Node...");
                  executeDefenseShift('OPERATIONAL'); // The physical database trigger
                }}
                className="w-full py-5 bg-transparent border border-blue-600 text-blue-400 hover:bg-blue-900/30 hover:text-white font-black text-xl tracking-widest rounded transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] uppercase"
              >
                Alpha Override: Unfreeze
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