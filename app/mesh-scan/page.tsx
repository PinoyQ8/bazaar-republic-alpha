'use client';

import { useState } from 'react';
import { useAuth } from "../context/AuthContext";

// Define the exact shape of our backend payout logs
interface LogEntry {
  uid: string;
  status: string;
  transferred?: string;
  txHash?: string;
  error?: string;
}

export default function MeshScanNode() {
  const { pioneer } = useAuth();
  
  // E-Network Distribution States
  const [meshState, setMeshState] = useState<string>('STANDBY');
  const [summaryData, setSummaryData] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // 🛡️ TS18048 FIX: Enforce a safe fallback
  const safeUsername = pioneer?.username || "PIONEER";

  const status = pioneer?.isAuthenticated 
    ? `ALIGNED: ${safeUsername.toUpperCase()}` 
    : "AWAITING UPLINK...";

  const executeEnetworkQueue = async () => {
    if (!pioneer?.isAuthenticated) {
      console.error("[MESH-BRIDGE] UNAUTHORIZED: Connect Pioneer identity first.");
      return;
    }

    // Phase 1: Lock UI and initiate the backend payout queue
    setMeshState('EXECUTING_QUEUE...');
    setLogs([]);
    setSummaryData(null);
    
    try {
      const response = await fetch('/api/cron/process-payouts', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMeshState('DISTRIBUTION_COMPLETE'); 
        setSummaryData(data.summary);
        setLogs(data.logs || []);
        console.log("[MESH-BRIDGE] TESTMBZR Queue Executed.");
      } else {
        setMeshState('SYNC_FAILED');
        setSummaryData("Server rejected the distribution payload.");
      }
    } catch (error) {
      console.error("[MESH-SCAN] Handshake Error:", error);
      setMeshState('NODE_DISCONNECTED');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4 selection:bg-green-900 selection:text-green-100">
      
      {/* Terminal Outer Shield - S23 Ultra Constrained */}
      <div className="w-full max-w-[384px] border border-green-500/30 p-1 bg-black/80 shadow-[0_0_20px_rgba(34,197,94,0.15)] rounded-sm">
        
        {/* Terminal Inner Viewport */}
        <div className="border border-green-500/70 p-5 relative">
          
          {/* Hardware Corner Decorators */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-green-400"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-green-400"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-green-400"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-green-400"></div>

          {/* Header */}
          <h1 className="text-xl font-bold mb-4 tracking-widest border-b border-green-500/50 pb-3 flex flex-col gap-1">
            <span>🛰️ X570 MESH-SCAN</span>
            <span className="text-xs text-green-600 animate-pulse tracking-normal">
              PORT 3000 // QUANTUM SECURE
            </span>
          </h1>
          
          {/* Telemetry Display */}
          <div className="bg-green-950/20 p-4 rounded-sm border border-green-800/50 mb-6 space-y-3">
            <div className="flex flex-col border-b border-green-900/50 pb-2">
              <span className="text-green-600 text-xs tracking-wider mb-1">NODE IDENTITY:</span> 
              <span className={`text-sm tracking-widest ${pioneer?.isAuthenticated ? "text-green-400 font-bold" : "text-yellow-500 animate-pulse"}`}>
                {status}
              </span>
            </div>
            <div className="flex flex-col pt-1">
              <span className="text-green-700 text-xs tracking-wider mb-1">Q-SHIELD STATUS:</span> 
              <span className={`text-sm font-bold ${meshState === 'DISTRIBUTION_COMPLETE' ? 'text-green-400' : 'text-amber-500'}`}>
                {meshState}
              </span>
            </div>
          </div>

          {/* Action Matrix */}
          <div className="flex flex-col gap-4 mt-4">
            <button 
              onClick={executeEnetworkQueue}
              disabled={!pioneer?.isAuthenticated || meshState === 'EXECUTING_QUEUE...'}
              className="w-full py-3 font-bold bg-transparent border border-green-500 text-green-500 rounded-sm uppercase tracking-wider text-sm hover:bg-green-500 hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-green-500 relative group"
            >
              {meshState === 'EXECUTING_QUEUE...' ? 'Processing Ledger...' : 'Fire TESTMBZR Queue'}
              {/* Scanline hover effect */}
              <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity"></div>
            </button>
          </div>

          {/* Payload Trace (Visible only if logs are returned) */}
          {logs.length > 0 && (
            <div className="mt-4 p-2 bg-black border border-green-900/50 rounded overflow-y-auto max-h-32">
              <p className="text-[10px] text-green-700 mb-1">// LEDGER SETTLEMENT TRACE</p>
              {summaryData && <p className="text-[10px] text-green-300 mb-2">{summaryData}</p>}
              
              {logs.map((log, i) => (
                <div key={i} className="mb-2 pb-2 border-b border-green-900/30 last:border-0 text-[10px]">
                  <div className="flex justify-between font-bold">
                    <span className="text-green-500">{log.uid}</span>
                    <span className={log.status === 'SUCCESS' ? 'text-green-400' : 'text-red-500'}>[{log.status}]</span>
                  </div>
                  {log.transferred && <div className="text-green-300 mt-0.5">Amt: {log.transferred}</div>}
                  {log.txHash && <div className="text-green-700 truncate mt-0.5">Tx: {log.txHash}</div>}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
      
      {/* System Footer */}
      <p className="mt-6 text-[10px] text-green-800 tracking-widest">
        PROJECT BAZAAR // NEO-PROTOCOL UPLINK
      </p>
    </div>
  );
}