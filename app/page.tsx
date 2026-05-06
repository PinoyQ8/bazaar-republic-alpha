"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
    if (typeof window === 'undefined' || !window.Pi) {
      addLog("ACCESS DENIED: You must access this node via the Pi Browser.");
      return;
    }

    try {
      addLog("Initiating Pi Core Authentication...");
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

  // 4. UI RENDERING PHASES
  if (currentPhase === 'GENESIS') {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono">
        <div className="w-full max-w-2xl border border-green-800 bg-black p-8 rounded-xl flex flex-col items-center shadow-[0_0_30px_rgba(20,83,45,0.3)]">
          <div className="mb-6 relative w-24 h-24">
            <Image src="/bazaar-logo.png" alt="Bazaar Republic" fill className="object-contain" />
          </div>
          <h1 className="text-3xl font-black text-green-500 uppercase mb-8">Bazaar Republic</h1>
          
          <button 
            onClick={executePiHandshake}
            className="w-full py-5 bg-green-900 hover:bg-green-800 text-white border-2 border-green-500 font-extrabold text-xl rounded flex items-center justify-center gap-4 uppercase"
          >
            <Image src="/mBZR_icon.png" alt="mBZR" width={24} height={24} />
            Connect Pi Wallet
          </button>

          <div className="mt-8 w-full bg-gray-900 p-4 rounded h-32 overflow-y-auto border border-gray-700 text-xs text-green-400">
            {meshLogs.map((log, i) => <div key={i}>{">_"} {log}</div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4">
      <h1 className="text-2xl font-bold mb-4">NODE OPERATIONAL</h1>
      <p className="mb-2">Citizen: {citizenUID?.substring(0, 8)}...</p>
      <p className="mb-8 text-xs text-gray-500">Wallet: {piWalletAddress}</p>
      <button 
        onClick={executeFounderReset}
        className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-950 transition-all uppercase text-xs"
      >
        Flush RAM & Restart
      </button>
    </div>
  );
}