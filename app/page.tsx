"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import GracePeriodBuffer from './components/GracePeriodBuffer';

// --- TYPE-2 DEFENSE: TYPESCRIPT ADJUDICATOR SHIELD ---
declare global {
  interface Window {
    Pi: any;
  }
}

type MeshPhase = 'GENESIS' | 'OPERATIONAL' | 'INTERCEPT' | 'STASIS';

export default function RepublicMasterNode() {
  // 1. STATE RECOVERY (The "Missing Names" Fix)
  const [currentPhase, setCurrentPhase] = useState<MeshPhase>('GENESIS');
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [citizenUID, setCitizenUID] = useState<string | null>(null);
  const [piWalletAddress, setPiWalletAddress] = useState<string | null>(null);

  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs; 
    });
  };

  // 2. THE INIT CIRCUIT
  useEffect(() => {
    addLog("Vercel Bridge Active. MESH Routing Matrix Online.");
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        window.Pi.init({ version: "2.0", sandbox: true });
        addLog("Pi SDK Handshake: Sandbox Mode INITIALIZED.");
      } catch (err) {
        addLog("ADJUDICATOR ERROR: Pi SDK Initialization Failed.");
      }
    }
  }, []);

  // 3. THE GLOBAL HANDSHAKE (Fixed Fetch Logic)
  const executePiHandshake = async () => {
    // --- ALPHA DEV: X570 DIAGNOSTIC BYPASS ---
    if (typeof window === 'undefined' || !window.Pi) {
      addLog("FOUNDER OVERRIDE: Booting Desktop Diagnostic Mode.");
      setCitizenUID("SYS_ADMIN_X570");
      setPiWalletAddress("DEBUG_WALLET_XYZ");
      setCurrentPhase('OPERATIONAL');
      return; // Stops the real Pi logic and forces you into the dashboard
    }

    try {
      addLog("Initiating Pi Core Authentication...");
      // ... [Keep your existing auth and fetch logic below this]
      const scopes = ['username', 'payments', 'wallet_address'];
      
      const auth = await window.Pi.authenticate(scopes, (incompletePayment: any) => {
        addLog(`Incomplete payment: ${incompletePayment.identifier}`);
      });

      if (auth && auth.user) {
        addLog("Pi Core Auth Success. Token Secured.");
        
        // Map SDK data to local state
        const uid = auth.user.uid;
        const username = auth.user.username;
        const wallet = auth.user.walletAddress || "PENDING";

        // THE VAULT PING (Syntactically correct fetch)
        const response = await fetch('/api/register-citizen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            citizen_uid: uid, 
            username: username,
            pi_wallet_address: wallet 
          }),
        });

        if (response.ok) {
          setCitizenUID(uid);
          setPiWalletAddress(wallet);
          addLog("VAULT ACCESSED: Citizen Registry Updated.");
          setCurrentPhase('OPERATIONAL');
        } else {
          const errorData = await response.json();
          addLog(`VAULT REJECTED: ${errorData.message}`);
        }
      }
    } catch (error) {
      addLog("HANDSHAKE REJECTED: Connection Error.");
      console.error("MESH Error:", error);
    }
  };

  const executeFounderReset = () => {
    setCurrentPhase('GENESIS');
    setCitizenUID(null);
    setMeshLogs([`[ALPHA DEV] FOUNDER OVERRIDE: RAM FLUSHED.`]);
  };

  // --- PHASE 2: OPERATIONAL (THE DASHBOARD) ---
  if (currentPhase === 'OPERATIONAL') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4">
        <div className="w-full max-w-2xl border border-green-800 bg-black p-8 rounded-xl shadow-[0_0_30px_rgba(20,83,45,0.2)]">
          <h1 className="text-2xl font-bold mb-4 uppercase tracking-widest text-center">NODE OPERATIONAL</h1>
          
          <div className="bg-gray-900 border border-gray-800 p-4 rounded mb-8">
            <p className="mb-2 text-sm text-gray-400">Citizen UID: <span className="text-green-400 font-bold">{citizenUID?.substring(0, 12)}...</span></p>
            <p className="text-xs text-gray-500">Linked Wallet: {piWalletAddress}</p>
          </div>

          {/* THE TRIGGER: Initiating the Defense Buffer */}
          <button 
            onClick={() => setCurrentPhase('INTERCEPT')}
            className="w-full py-4 bg-gray-900 hover:bg-yellow-900 text-yellow-500 font-bold border border-yellow-700 uppercase tracking-widest rounded transition-all mb-4 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
          >
            Initiate Transfer (Test Shield)
          </button>
        </div>
        
        <button 
          onClick={executeFounderReset}
          className="mt-8 px-6 py-2 border border-red-900 text-red-500 hover:bg-red-950 transition-all uppercase text-xs"
        >
          Flush RAM & Restart
        </button>
      </div>
    );
  }

  // --- PHASE 3: INTERCEPT (THE 60-SECOND TIMER) ---
  if (currentPhase === 'INTERCEPT') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono">
        <div className="w-full max-w-2xl">
          <GracePeriodBuffer 
            onAuthorize={() => {
              addLog("Transaction Authorized via Interception Buffer.");
              setCurrentPhase('OPERATIONAL'); // Returns to dashboard upon success
            }}
            onStasis={() => {
              addLog("CRITICAL: Stasis Lock Engaged by Pioneer.");
              setCurrentPhase('STASIS'); // Triggers the Vault deadbolt
            }}
          />
        </div>
      </div>
    );
  }

  // --- PHASE 4: STASIS (THE VAULT DEADBOLT) ---
  if (currentPhase === 'STASIS') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-red-950 px-4 py-10 font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-red-500 opacity-10 animate-pulse pointer-events-none"></div>
        <div className="w-full max-w-2xl border-2 border-red-600 bg-black p-8 rounded-xl z-10 shadow-[0_0_50px_rgba(220,38,38,0.4)] text-center">
          <h1 className="text-4xl font-black text-red-500 uppercase tracking-widest mb-4">STASIS LOCK ENGAGED</h1>
          <p className="text-gray-300 mb-8 leading-relaxed">
            All outbound transactions have been mathematically frozen at the protocol level. 
            Your assets are secure.
          </p>
          <div className="w-full py-4 bg-gray-900 border border-red-900 text-red-700 font-bold uppercase tracking-widest rounded opacity-50 cursor-not-allowed">
            Node Locked
          </div>
        </div>
        
        <button 
          onClick={executeFounderReset}
          className="mt-8 px-6 py-2 border border-red-900 text-red-500 hover:bg-red-950 transition-all uppercase text-xs z-10"
        >
          Flush RAM (Founder Override)
        </button>
      </div>
    );
  }

  return null; // Safety Fallback
}