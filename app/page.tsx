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
  const [accessToken, setAccessToken] = useState<string | null>(null); // TOKEN BUFFER

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
      addLog("WARNING: Pi Browser environment not detected.");
    }
  }, []);

  // --- THE GLOBAL HANDSHAKE PROTOCOL ---
  const executePiHandshake = async () => {
    try {
      addLog("Initiating Pi Core Authentication...");
      
      const scopes = ['username', 'payments', 'wallet_address'];
      const auth = await window.Pi.authenticate(scopes, (incompletePayment: any) => {
        addLog(`Incomplete payment detected: ${incompletePayment.identifier}`);
      });

      if (auth && auth.user) {
        addLog("Pi Core Auth Success. Token Secured.");
        
        // ADJUDICATOR FIX: Determine the correct API bridge URL
        // If we are on Vercel, use the absolute URL to prevent localhost 404s
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://mesh-academy-alpha.vercel.app' 
          : ''; 

        const response = await fetch(`${baseUrl}/api/register-citizen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid: auth.user.uid, 
            username: auth.user.username,
            walletAddress: auth.user.walletAddress || "PENDING"
          }),
        });

        if (response.ok) {
          addLog("VAULT ACCESSED: Citizen Registry Updated.");
          setCurrentPhase('OPERATIONAL');
        } else {
          const errorData = await response.json();
          addLog(`VAULT REJECTED: ${errorData.message}`);
        }
      }
    } catch (error) {
      addLog("HANDSHAKE REJECTED: SDK Connection Error.");
      console.error("MESH Error:", error);
    }
  };

  // --- TYPE-2 DEFENSE: STATE TOGGLE PROTOCOL ---
  const executeDefenseShift = async (targetState: 'STASIS' | 'OPERATIONAL') => {
    if (!citizenUID || !accessToken) return;
    
    try {
      addLog(`Commanding Shield: Shift to [${targetState}]...`);
      
      const response = await fetch('/api/toggle-defense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: citizenUID, 
          target_status: targetState,
          token: accessToken // PASS TOKEN FOR VERIFICATION
        })
      });

      const data = await response.json();

      if (response.ok && data.mesh_status === "SUCCESS") {
        setDefenseStatus(targetState);
        setCurrentPhase(targetState);
        addLog(`Vault Confirmed: State set to ${targetState}.`);
      } else {
        addLog(`SECURITY REJECTION: ${data.message}`);
      }
    } catch (error) {
      addLog("Network fracture during state shift.");
    }
  };

  const executeFounderReset = () => {
    setCurrentPhase('GENESIS');
    setCitizenUID(null);
    setAccessToken(null);
    setMeshLogs([`[${new Date().toLocaleTimeString()}] RAM FLUSHED.`]);
  };

  // --- VIEWPORT RENDERING ---
  if (currentPhase === 'GENESIS') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono relative">
        <div className="w-full max-w-2xl border border-green-800 bg-black p-8 rounded-xl flex flex-col items-center shadow-lg">
          <div className="mb-6 relative w-24 h-24">
            <Image src="/bazaar-logo.png" alt="Logo" fill sizes="96px" className="object-contain" />
          </div>
          <h1 className="text-3xl font-black text-green-500 uppercase tracking-widest mb-8">Bazaar Republic</h1>
          <button 
  onClick={executePiHandshake} // FIXED: Matches the function name in your logic block
  className="w-full py-5 bg-green-900 hover:bg-green-800 text-white border-2 border-green-500 font-extrabold text-xl tracking-widest rounded transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-4 uppercase"
>
  <Image src="/mBZR_icon.png" alt="mBZR" width={24} height={24} />
  Connect Pi Wallet
</button>
          <div className="mt-8 w-full bg-gray-900 p-4 rounded h-32 overflow-y-auto border border-gray-700 text-xs text-green-400">
            {meshLogs.map((log, index) => <div key={index}>{">_"} {log}</div>)}
          </div>
        </div>
        <FounderResetButton onReset={executeFounderReset} />
      </div>
    );
  }

  if (currentPhase === 'INTERCEPT') {
    return (
      <div className="relative w-full min-h-screen">
        <GracePeriodBuffer 
          abortFreeze={() => setCurrentPhase('OPERATIONAL')}
          executeImmediateLock={() => executeDefenseShift('STASIS')}
        />
        <FounderResetButton onReset={executeFounderReset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono relative">
      <div className={`w-full max-w-2xl border p-8 rounded-xl flex flex-col items-center shadow-lg ${currentPhase === 'STASIS' ? 'bg-red-950 border-red-600' : 'bg-black border-green-800'}`}>
        
        <h1 className={`font-black tracking-widest uppercase text-3xl mb-6 ${currentPhase === 'STASIS' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
          Bazaar Republic
        </h1>

        {/* VAULT IDENTITY PANEL */}
        <div className={`w-full p-4 rounded border mb-6 text-left ${currentPhase === 'STASIS' ? 'bg-black border-red-800' : 'bg-gray-900 border-green-800'}`}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Pioneer:</span>
            <span className="text-green-400 font-mono">@{citizenUsername}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Defense:</span>
            <span className={`font-black ${currentPhase === 'STASIS' ? 'text-red-500' : 'text-green-500'}`}>[{defenseStatus}]</span>
          </div>
        </div>

        <div className="w-full">
          {currentPhase === 'OPERATIONAL' ? (
            <button onClick={() => setCurrentPhase('INTERCEPT')} className="w-full py-5 bg-red-900 text-white font-extrabold text-xl rounded uppercase">
              Initiate Self-Freeze
            </button>
          ) : (
            <button onClick={() => executeDefenseShift('OPERATIONAL')} className="w-full py-5 bg-blue-900 text-white font-extrabold text-xl rounded uppercase">
              Alpha Override: Unfreeze
            </button>
          )}
        </div>

        <div className="mt-8 w-full bg-black p-3 rounded h-32 overflow-y-auto border border-gray-800 text-[11px] text-gray-500">
          {meshLogs.map((log, index) => <div key={index}>{log}</div>)}
        </div>
      </div>
      <FounderResetButton onReset={executeFounderReset} />
    </div>
  );
}

function FounderResetButton({ onReset }: { onReset: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button onClick={onReset} className="px-3 py-2 bg-gray-900 border border-gray-600 text-gray-400 text-[10px] rounded">[ F-Reset ]</button>
    </div>
  );
}