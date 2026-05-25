"use client";

import { useState, useEffect } from 'react';

// 🚨 The MESH relies strictly on app/types/global.d.ts for Window.Pi
// Do not declare it here.

export default function MeshClaim() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [status, setStatus] = useState<string>("AWAITING_SYNC");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const MESH_ASSET_CODE = "mBZR";
  // The official Horizon Testnet endpoint
  const HORIZON_URL = "https://horizon-testnet.stellar.org";

  const logToTerminal = (message: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Phase 1: SDK Initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: true });
      setStatus("MESH_READY");
      logToTerminal("Pi SDK Injected. MESH Ready.");
    } else {
      setStatus("PI_SDK_MISSING");
      logToTerminal("WARNING: Pi SDK not detected in window.");
    }
  }, []);

  const executeClaimMatrix = async () => {
    if (!walletAddress.startsWith("G") || walletAddress.length !== 56) {
      logToTerminal("❌ MESH HALT: Invalid Public Key format.");
      return;
    }

    setIsLoading(true);
    logToTerminal(`Initiating Pre-Flight check for: ${walletAddress.substring(0, 8)}...`);

    try {
      // Phase 2: The Trustline Gate (Horizon Ledger Scan)
      const horizonRes = await fetch(`${HORIZON_URL}/accounts/${walletAddress}`);
      
      if (!horizonRes.ok) {
        throw new Error("Wallet not found on Horizon Testnet. Is it funded?");
      }

      const accountData = await horizonRes.json();
      const balances = accountData.balances || [];
      
      const hasTrustline = balances.some((b: any) => b.asset_code === MESH_ASSET_CODE);

      if (!hasTrustline) {
        logToTerminal(`🛑 GOVERNANCE LOCK: Trustline for ${MESH_ASSET_CODE} is missing.`);
        setIsLoading(false);
        return; // Abort before hitting the backend
      }

      logToTerminal(`✅ Trustline Verified. Charging payload...`);

      // Phase 3: The Payload Strike
      const claimRes = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      });

      const claimData = await claimRes.json();

      if (!claimRes.ok) {
        logToTerminal(`❌ STRIKE FAILED: ${claimData.error}`);
      } else {
        logToTerminal(`✅ CLAIM SUCCESS: ${claimData.message || 'Transaction executed.'}`);
      }

    } catch (error: any) {
      logToTerminal(`❌ NETWORK FRACTURE: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-gray-900 border border-gray-700 rounded-lg font-mono text-green-400">
      <h2 className="text-xl font-bold mb-4 text-white">X570 DOMAIN: MESH CLAIM</h2>
      
      <div className="mb-4">
        <label className="block text-sm mb-2 text-gray-400">PIONEER WALLET (G-ADDRESS)</label>
        <input 
          type="text" 
          className="w-full p-2 bg-black border border-gray-600 rounded text-green-300 focus:outline-none focus:border-green-500"
          placeholder="G..."
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <button 
        onClick={executeClaimMatrix}
        disabled={isLoading || status === "PI_SDK_MISSING"}
        className={`w-full py-3 rounded font-bold text-black transition-colors ${
          isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400'
        }`}
      >
        {isLoading ? 'EXECUTING MATRIX...' : 'VERIFY & CLAIM'}
      </button>

      <div className="mt-6 bg-black p-4 rounded h-48 overflow-y-auto text-xs border border-gray-800">
        <div className="text-gray-500 mb-2">// TERMINAL ECHO</div>
        {consoleLogs.map((log, index) => (
          <div key={index} className="mb-1">{log}</div>
        ))}
      </div>
    </div>
  );
}