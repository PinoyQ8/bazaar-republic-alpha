"use client";

import { useState } from 'react';

export default function FaucetClaim() {
  const [walletAddress, setWalletAddress] = useState('');
  const [pioneerUid, setPioneerUid] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'FORGING' | 'SECURE' | 'FRACTURE'>('IDLE');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // 🛡️ MESH-CORE: Telemetry Logging Engine
  const logToTerminal = (message: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const triggerClaim = async () => {
    if (!walletAddress || !pioneerUid) {
      logToTerminal('❌ SECURITY HALT: Pioneer UID and Wallet Address required.');
      return;
    }

    setStatus('FORGING');
    logToTerminal('Initiating secure uplink to the Distributor Node...');

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('FRACTURE');
        logToTerminal(`❌ STRIKE FAILED: ${data.error}`);
      } else {
        setStatus('SECURE');
        logToTerminal(`✅ CLAIM SUCCESS: Ledger Hash: ${data.ledger_hash}`);
      }
    } catch (error: any) {
      setStatus('FRACTURE');
      logToTerminal(`❌ NETWORK FRACTURE: ${error.message}`);
    }
  };

  return (
    <div className="p-6 border border-gray-700 bg-gray-900 text-green-400 font-mono rounded-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4 border-b border-green-500 pb-2">🛡️ MESH-FAUCET: DISTRIBUTOR UPLINK</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-300">Real Pioneer UID</label>
          <input 
            type="text" 
            value={pioneerUid}
            onChange={(e) => setPioneerUid(e.target.value)}
            className="w-full bg-black border border-gray-600 p-2 focus:outline-none focus:border-green-500 text-white"
            placeholder="e.g., PiNet_User_001"
            disabled={status === 'FORGING'}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">Destination Wallet (Public Key)</label>
          <input 
            type="text" 
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full bg-black border border-gray-600 p-2 focus:outline-none focus:border-green-500 text-white"
            placeholder="GAI5D..."
            disabled={status === 'FORGING'}
          />
        </div>

        <button 
          onClick={triggerClaim}
          disabled={status === 'FORGING'}
          className="w-full bg-green-700 hover:bg-green-600 text-black font-bold py-2 px-4 rounded transition-all disabled:opacity-50"
        >
          {status === 'FORGING' ? 'SIGNING PAYLOAD...' : 'CLAIM mBZR TRANCHE'}
        </button>

        {/* 🛡️ MESH TELEMETRY READOUT */}
        <div className="mt-6 bg-black p-4 rounded h-40 overflow-y-auto text-xs border border-gray-800">
          <div className="text-gray-500 mb-2">// TERMINAL TELEMETRY</div>
          {consoleLogs.map((log, index) => (
            <div key={index} className="mb-1 text-green-300">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}