"use client";

import { useState, useEffect } from 'react';

// --- MESH TYPING ---
type PeerStatus = 'PENDING' | 'AUTHENTICATED';

interface PeerNode {
  id: string;
  designation: string;
  status: PeerStatus;
}

export default function TribunalRecoveryOverride() {
  // --- STATE MEMORY ---
  const [peers, setPeers] = useState<PeerNode[]>([
    { id: 'Node-Alpha', designation: 'DAO Sentinel 1', status: 'PENDING' },
    { id: 'Node-Beta', designation: 'DAO Sentinel 2', status: 'PENDING' },
    { id: 'Node-Gamma', designation: 'Cold Storage Vault', status: 'PENDING' },
    { id: 'Node-Delta', designation: 'Trusted Pioneer A', status: 'PENDING' },
    { id: 'Node-Epsilon', designation: 'Trusted Pioneer B', status: 'PENDING' },
  ]);
  
  const [inputKey, setInputKey] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [meshLogs, setMeshLogs] = useState<string[]>([]);

  const REQUIRED_THRESHOLD = 3;
  const currentSignatures = peers.filter(p => p.status === 'AUTHENTICATED').length;
  const thresholdMet = currentSignatures >= REQUIRED_THRESHOLD;

  // --- TERMINAL LOGGING ---
  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      return newLogs.length > 6 ? newLogs.slice(1) : newLogs; 
    });
  };

  useEffect(() => {
    addLog("System Boot: Tribunal Recovery Route Active.");
    addLog("WARNING: Stasis Lock detected. 5-Tier Equilibrium required for override.");
    addLog(`Multi-Sig Threshold: ${REQUIRED_THRESHOLD} of 5 authenticated nodes required.`);
  }, []);

  // --- CRYPTOGRAPHIC INJECTION (Mock Logic) ---
  const handleSignatureInjection = () => {
    if (!inputKey.trim() || inputKey.length < 8) {
      addLog("ERROR: Invalid cryptographic string. Rejection logged.");
      return;
    }

    // Find the next pending node to authenticate
    const nextNodeIndex = peers.findIndex(p => p.status === 'PENDING');
    
    if (nextNodeIndex !== -1) {
      const updatedPeers = [...peers];
      updatedPeers[nextNodeIndex].status = 'AUTHENTICATED';
      setPeers(updatedPeers);
      addLog(`SUCCESS: ${updatedPeers[nextNodeIndex].id} signature verified.`);
      setInputKey('');
    }
  };

  // --- ASSET MIGRATION EXECUTION ---
  const executeMigration = () => {
    setIsMigrating(true);
    addLog("INITIATING: Vercel Bridge receiving 3-of-5 Multi-Sig payload...");
    addLog("Soroban Smart Contract executing asset transfer...");

    // Simulate backend ledger transaction
    setTimeout(() => {
      setIsMigrating(false);
      setMigrationComplete(true);
      addLog("L1 LEDGER CONFIRMED: Stasis Lock broken.");
      addLog("Assets successfully migrated to clean Republic Vault.");
    }, 3500);
  };

  // --- VIEWPORT RENDERING ---
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono">
      <div className={`w-full max-w-3xl border p-8 rounded-xl flex flex-col items-center shadow-lg transition-colors duration-1000 ${
        migrationComplete 
          ? 'bg-green-950 border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]' 
          : 'bg-black border-cyan-900 shadow-[0_0_30px_rgba(8,145,178,0.2)]'
      }`}>
        
        {/* Header Dashboard */}
        <div className={`text-center mb-8 w-full border-b pb-4 ${migrationComplete ? 'border-green-800' : 'border-cyan-900'}`}>
          <h1 className={`font-black tracking-widest uppercase text-3xl ${migrationComplete ? 'text-green-500' : 'text-cyan-500'}`}>
            {migrationComplete ? 'Migration Successful' : 'Tribunal Recovery Protocol'}
          </h1>
          <p className="text-gray-400 text-sm mt-2 uppercase tracking-wider">
            {migrationComplete ? 'E-Network Vault Secured' : '5-Tier Equilibrium • MESH Multi-Sig'}
          </p>
        </div>

        {!migrationComplete ? (
          <>
            {/* 5-Tier Equilibrium Visualizer */}
            <div className="w-full mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest">
                  Consensus Matrix
                </span>
                <span className={`text-xs font-black ${thresholdMet ? 'text-green-400 animate-pulse' : 'text-cyan-600'}`}>
                  {currentSignatures} / {REQUIRED_THRESHOLD} SECURED
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {peers.map((peer) => (
                  <div key={peer.id} className={`p-3 rounded border text-center ${
                    peer.status === 'AUTHENTICATED' 
                      ? 'bg-cyan-900 border-cyan-500 text-cyan-200' 
                      : 'bg-gray-900 border-gray-700 text-gray-500'
                  }`}>
                    <div className="text-[10px] uppercase tracking-wider mb-1">{peer.designation}</div>
                    <div className="text-xs font-bold">{peer.id}</div>
                    <div className="mt-2 text-[9px] tracking-widest">
                      {peer.status === 'AUTHENTICATED' ? '✓ VERIFIED' : 'PENDING'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Injection Terminal */}
            <div className="w-full bg-gray-900 p-6 rounded border border-gray-700 mb-8">
              <label className="block text-gray-400 text-xs uppercase tracking-widest mb-3">
                Inject Peer Node Signature
              </label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  disabled={thresholdMet}
                  placeholder="Paste 64-char ed25519 hash..."
                  className="flex-1 bg-black border border-gray-600 rounded px-4 py-3 text-cyan-400 focus:outline-none focus:border-cyan-500 text-sm disabled:opacity-50"
                />
                <button 
                  onClick={handleSignatureInjection}
                  disabled={thresholdMet || !inputKey}
                  className="px-6 py-3 bg-cyan-800 hover:bg-cyan-700 text-white font-bold tracking-widest uppercase rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Execution Command */}
            <div className="w-full">
              <button 
                onClick={executeMigration}
                disabled={!thresholdMet || isMigrating}
                className={`w-full py-5 font-extrabold text-xl tracking-widest rounded transition-all uppercase ${
                  !thresholdMet 
                    ? 'bg-black text-gray-600 border border-gray-800 cursor-not-allowed' 
                    : isMigrating
                      ? 'bg-yellow-700 text-yellow-200 cursor-wait'
                      : 'bg-red-700 hover:bg-red-600 text-white border border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)]'
                }`}
              >
                {isMigrating ? 'Forging Blockchain Ledger...' : 'Execute Asset Migration'}
              </button>
            </div>
          </>
        ) : (
          <div className="w-full text-center py-10">
            <div className="text-6xl mb-6">🛡️</div>
            <h2 className="text-2xl font-bold text-green-400 mb-4 uppercase tracking-widest">
              Recovery Complete
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              The Type-2 Stasis Lock has been successfully bypassed via decentralized consensus. Your assets have been securely routed to your designated cold storage node.
            </p>
          </div>
        )}

        {/* MESH Terminal Output */}
        <div className="mt-8 w-full bg-black p-4 rounded h-36 overflow-y-auto border border-gray-800 text-[11px] text-gray-500">
          {meshLogs.map((log, index) => (
             <div key={index} className="mb-1">{log}</div>
          ))}
        </div>

      </div>
    </div>
  );
}