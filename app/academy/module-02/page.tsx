"use client";

import React, { useState } from 'react';

export default function Module02Architecture() {
  // SECTOR 1: Volatile Memory (Quiz State) -> 🛡️ PATCHED: q4 allocated in memory
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [verificationStatus, setVerificationStatus] = useState<'IDLE' | 'FAILED' | 'PASSED'>('IDLE');
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');

  // SECTOR 2: Logic Validation Gate -> 🛡️ PATCHED: q4 verification added
  const handleVerify = () => {
    // Correct Array: Q1 = A, Q2 = C, Q3 = B, Q4 = B
    if (answers.q1 === 'A' && answers.q2 === 'C' && answers.q3 === 'B' && answers.q4 === 'B') {
      setVerificationStatus('PASSED');
    } else {
      setVerificationStatus('FAILED');
    }
  };

  // SECTOR 3: Ledger Sync (Connected to Data Fortress)
  const commitToLedger = async () => {
    setSyncStatus('SYNCING');
    
    // Read the active node from S23 Ultra RAM
    const activeNode = localStorage.getItem('active_pioneer_node');
    
    if (!activeNode) {
      console.error("❌ LOCAL RAM VOID: Sync node first.");
      setSyncStatus('IDLE'); // You might want to add an 'ERROR' state later
      return;
    }

    try {
      const response = await fetch('/api/update-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: activeNode })
      });

      if (response.ok) {
        setSyncStatus('SUCCESS');
        console.log("✅ MESH_UPDATE: L_sync parameter permanently locked.");
      } else {
        setSyncStatus('IDLE');
        console.error("❌ MESH_REJECT: Oracle denied sync.");
      }
    } catch (error) {
      setSyncStatus('IDLE');
      console.error("❌ VAULT_ACCESS_FAILED");
    }
  };

  // SECTOR 4: Viewport Render (S23 Ultra Optimized)
  return (
    <div className="p-4 bg-black min-h-screen font-mono text-zinc-300 space-y-6">
      
      {/* SYLLABUS TIER */}
      <div className="border border-zinc-800 p-5 rounded-lg bg-zinc-950">
        <h1 className="text-blue-500 text-sm tracking-widest uppercase mb-4">Module_02: E-Network Architecture</h1>
        
        <div className="space-y-4 text-xs leading-relaxed text-zinc-400">
          <p><strong className="text-zinc-200">1. The MESH:</strong> The Decentralized Security Protocol that governs the Project Bazaar DAO. It ensures zero single-points-of-failure.</p>
          <p><strong className="text-zinc-200">2. Node Classification:</strong><br/>
             - <em>Pioneer Nodes:</em> The edge users (mobile/desktop).<br/>
             - <em>Vercel Edge:</em> The routing layer.<br/>
             - <em>Data Fortress:</em> MongoDB state management.</p>
          <p><strong className="text-zinc-200">3. TrustScore (TS):</strong> The ultimate metric of a Pioneer. Calculated via: <code>TS = K * (P_align + S_stake + C_eco + L_sync)</code>.</p>
          <p><strong className="text-zinc-200">4. Governance Unlocking:</strong> A Pioneer must maintain a TrustScore of <strong>90% or higher</strong> to vote on DAO directives.</p>
        </div>
      </div>

      {/* VERIFICATION TIER (The Quiz) */}
      <div className="border border-blue-900/50 p-5 rounded-lg bg-blue-950/10 space-y-5">
        <h2 className="text-[10px] text-blue-400 uppercase tracking-widest">Logic Verification Array</h2>

        {/* Q1 */}
        <div className="space-y-2">
          <p className="text-xs">Q1: What is the correct Master TrustScore formula?</p>
          <select 
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs rounded outline-none focus:border-blue-500"
            onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
          >
            <option value="">Select Logic...</option>
            <option value="A">TS = K * (P + S + C + L)</option>
            <option value="B">TS = (P + S) / K</option>
            <option value="C">TS = L_sync * 100</option>
          </select>
        </div>

        {/* Q2 */}
        <div className="space-y-2">
          <p className="text-xs">Q2: Which node layer handles state management?</p>
          <select 
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs rounded outline-none focus:border-blue-500"
            onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
          >
            <option value="">Select Logic...</option>
            <option value="A">Pioneer Nodes</option>
            <option value="B">Vercel Edge</option>
            <option value="C">Data Fortress (MongoDB)</option>
          </select>
        </div>

        {/* Q3 */}
        <div className="space-y-2">
          <p className="text-xs">Q3: What TrustScore triggers Governance Unlocking?</p>
          <select 
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs rounded outline-none focus:border-blue-500"
            onChange={(e) => setAnswers({ ...answers, q3: e.target.value })}
          >
            <option value="">Select Logic...</option>
            <option value="A">50%</option>
            <option value="B">90%</option>
            <option value="C">100%</option>
          </select>
        </div>

        {/* Q4 */}
        <div className="space-y-2">
          <p className="text-xs">Q4: What happens if a Pioneer&apos;s Uptime Shield drops below 92%?</p>
          <select 
            className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs rounded outline-none focus:border-blue-500"
            onChange={(e) => setAnswers({ ...answers, q4: e.target.value })}
          >
            <option value="">Select Logic...</option>
            <option value="A">Nothing</option>
            <option value="B">TrustScore Decay (Penalty)</option>
            <option value="C">Immediate Node Ban</option>
          </select>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleVerify}
          className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-blue-100 text-xs font-bold uppercase tracking-widest rounded transition-colors"
        >
          Verify Alignment
        </button>

        {verificationStatus === 'FAILED' && (
          <p className="text-[10px] text-red-500 text-center animate-pulse">{"!! "} LOGIC_MISMATCH. REVIEW ARCHITECTURE.</p>
        )}
      </div>

      {/* COMMIT TIER (Only visible if PASSED) */}
      {verificationStatus === 'PASSED' && (
        <div className="border border-green-800 p-5 rounded-lg bg-green-950/20 text-center space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[10px] text-green-400 uppercase tracking-widest">{">> "} Alignment Verified</p>
          
          <button 
            onClick={commitToLedger}
            disabled={syncStatus !== 'IDLE'}
            className={`w-full py-3 font-bold text-xs uppercase tracking-widest rounded transition-all ${
              syncStatus === 'IDLE' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {syncStatus === 'IDLE' ? 'Sync L_Sync to Ledger' : syncStatus === 'SYNCING' ? 'Writing to Block...' : 'Module Complete'}
          </button>
        </div>
      )}

    </div>
  );
}