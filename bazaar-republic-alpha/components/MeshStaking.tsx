'use client';

import React, { useState, useEffect } from 'react';
import { MESH_CONTRACT_ID, mBZR_TOKEN_WRAPPER_ID, checkBlockchainStatus } from '../lib/blockchain';

export default function MeshStaking() {
  const [loading, setLoading] = useState<boolean>(true);
  const [networkStatus, setNetworkStatus] = useState<string>('INIT');
  const [treasuryBalances, setTreasuryBalances] = useState<any[]>([]);
  const [stakeAmount, setStakeAmount] = useState<number>(10); // Matches our 10 mBZR core rule

  useEffect(() => {
    async function auditNetwork() {
      const telemetry = await checkBlockchainStatus();
      setNetworkStatus(telemetry.status);
      setTreasuryBalances(telemetry.balances);
      setLoading(false);
    }
    auditNetwork();
  }, []);

  const handleStakingSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`📡 Initializing Staking Vector: ${stakeAmount} mBZR targeting Contract: ${MESH_CONTRACT_ID}`);
    // This will house our Pi Wallet Bridge invocation in the next phase
    alert(`Handshake Simulated! Staking 10 mBZR to Contract Core.`);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 text-cyan-400 p-6 rounded-lg border border-cyan-800 animate-pulse font-mono max-w-90 mx-auto">
        [MESH-SCAN] Syncing ledger telemetries...
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 font-mono max-w-90 mx-auto shadow-2xl">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">MESH CONSENSUS ENGINE</h2>
        <span className={`h-2 w-2 rounded-full ${networkStatus === 'SECURE' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
      </div>

      {/* BLOCKCHAIN METADATA */}
      <div className="space-y-2 text-[11px] bg-slate-900 p-2 rounded border border-slate-800/50 mb-4">
        <div><span className="text-slate-500">NET:</span> <span className="text-amber-400">Pi Testnet</span></div>
        <div><span className="text-slate-500">CORE:</span> <span className="text-cyan-400 truncate block">{MESH_CONTRACT_ID.substring(0, 12)}...{MESH_CONTRACT_ID.substring(44)}</span></div>
        <div><span className="text-slate-500">TOKEN:</span> <span className="text-purple-400 truncate block">mBZR ({mBZR_TOKEN_WRAPPER_ID.substring(0, 6)}...)</span></div>
      </div>

      {/* TREASURY STATUS DISPLAY */}
      <div className="mb-4">
        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Ecosystem Vault Balances</label>
        <div className="bg-slate-900/50 border border-slate-800 rounded p-2 max-h-20 overflow-y-auto space-y-1">
          {treasuryBalances.length === 0 ? (
            <div className="text-[10px] text-slate-400 italic">[MOCK STATE ACTIVE] 0.00 Native Assets</div>
          ) : (
            treasuryBalances.map((bal, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <span className="text-slate-400">{bal.asset_type === 'native' ? 'Pi' : bal.asset_code}:</span>
                <span className="text-emerald-400 font-bold">{parseFloat(bal.balance).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* STAKING FORM EXECUTION */}
      <form onSubmit={handleStakingSubmission} className="space-y-3">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Required Node Stake</label>
          <div className="relative">
            <input 
              type="number" 
              readOnly 
              value={stakeAmount}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 font-bold focus:outline-none"
            />
            <span className="absolute right-3 top-2 text-xs text-purple-400 font-bold">mBZR</span>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded transition-all duration-200 uppercase tracking-widest shadow-lg shadow-cyan-900/20 active:scale-[0.98]"
        >
          Activate Validation Node
        </button>
      </form>
    </div>
  );
}