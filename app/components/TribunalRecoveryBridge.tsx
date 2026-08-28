"use client";

import { useState } from 'react';

interface TribunalProps {
  citizenUID?: string;
}

export default function TribunalRecoveryBridge({ citizenUID }: TribunalProps) {
  const [claimAddress, setClaimAddress] = useState("");
  const [meshLogs, setMeshLogs] = useState<string[]>(["[SYSTEM] Tribunal Bridge Online. Scanning for claims..."]);
  const [bridgeState, setBridgeState] = useState<'IDLE' | 'SCANNING' | 'REJECTED' | 'APPROVED'>('IDLE');

  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 5 ? newLogs.slice(1) : newLogs;
    });
  };

  // 🛡️ ACTION 1: THE PIONEER APPEALS A STASIS LOCK
  const executeStasisAppeal = async () => {
    addLog(`Initiating Stasis Appeal for Citizen UID: ${citizenUID}`);
    setBridgeState('SCANNING');
    
    try {
      addLog("Transmitting appeal to /api/lift-stasis...");
      const res = await fetch('/api/lift-stasis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citizen_uid: citizenUID })
      });

      if (res.ok) {
        addLog("TRIBUNAL VERDICT: Stasis Lifted. Refresh to re-enter Vault.");
        setBridgeState('APPROVED');
      } else {
        addLog("TRIBUNAL VERDICT: Appeal Denied. DAO consensus required.");
        setBridgeState('REJECTED');
      }
    } catch (e) {
      addLog("NETWORK FAULT: Connection to Vault severed.");
      setBridgeState('IDLE');
    }
  };

  // 🛡️ ACTION 2: THE HEIR CLAIMS THE VAULT
  const executeHeirClaim = async () => {
    if (!claimAddress || claimAddress.length < 10) {
      addLog("FAULT: Invalid cryptographic address format.");
      return;
    }

    addLog(`Scanning Postgres Vaults for Heir Address: ${claimAddress}...`);
    setBridgeState('SCANNING');

    // NOTE: This currently simulates the check until we build the /api/check-claim route
    setTimeout(() => {
      addLog("TRIBUNAL VERDICT: Address not found in any triggered Vaults.");
      setBridgeState('REJECTED');
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4 font-mono">
      <div className="w-full max-w-3xl border border-red-900 bg-gray-950 p-8 rounded-xl shadow-[0_0_30px_rgba(153,27,27,0.3)]">
        
        <div className="text-center mb-8 border-b border-red-900 pb-6">
          <h1 className="text-3xl font-black text-red-600 uppercase tracking-widest">The Tribunal Bridge</h1>
          <p className="text-gray-400 mt-2 text-sm">Decentralized Asset Recovery & Heir Distribution</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT PANEL: PIONEER RECOVERY */}
          <div className="bg-black border border-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-yellow-500 mb-2 uppercase">Account in Stasis</h2>
            <p className="text-xs text-gray-500 mb-6">UID: {citizenUID || "UNKNOWN_CITIZEN"}</p>
            <p className="text-sm text-gray-400 mb-6">
              Your E-Network Vault was frozen via the Intercept Shield. To regain access, you must petition the DAO.
            </p>
            <button 
              onClick={executeStasisAppeal}
              disabled={bridgeState === 'SCANNING'}
              className="w-full py-4 bg-yellow-900/40 hover:bg-yellow-900 text-yellow-500 border border-yellow-700 font-bold uppercase rounded transition-colors disabled:opacity-50"
            >
              Petition Tribunal
            </button>
          </div>

          {/* RIGHT PANEL: HEIR CLAIM */}
          <div className="bg-black border border-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-blue-500 mb-2 uppercase">Execute Claim</h2>
            <p className="text-xs text-gray-500 mb-6">Deadman Switch Protocol</p>
            
            <input 
              type="text" 
              value={claimAddress}
              onChange={(e) => setClaimAddress(e.target.value)}
              placeholder="Enter your Pi Wallet Address..."
              className="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded mb-4 focus:outline-none focus:border-blue-500 text-sm"
            />
            
            <button 
              onClick={executeHeirClaim}
              disabled={bridgeState === 'SCANNING'}
              className="w-full py-4 bg-blue-900/40 hover:bg-blue-900 text-blue-500 border border-blue-700 font-bold uppercase rounded transition-colors disabled:opacity-50"
            >
              Scan For Inheritance
            </button>
          </div>
        </div>

        {/* TERMINAL LOGS */}
        <div className="mt-8 bg-gray-900 p-4 rounded h-40 overflow-y-auto text-xs text-red-400 text-left border border-red-900/50">
          {meshLogs.map((log, i) => (
            <div key={i} className="mb-1">{">_"} {log}</div>
          ))}
        </div>

      </div>
    </div>
  );
}