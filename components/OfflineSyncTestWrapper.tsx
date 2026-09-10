"use client";

/**
 * @file OfflineSyncTestWrapper.tsx
 * @package Bazaar Republic Layer-2 DePIN Infrastructure
 * @version 1.0.0
 * @summary Staging wrapper to simulate network disconnects, test local storage queue buffering,
 *          and verify automated reconnection sync logic on the S23 Ultra.
 */

import React, { useState, useEffect } from "react";
import { usePiLocalStorage, OfflineTx } from '@/hooks/usePiLocalStorage';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Activity, 
  ArrowUpRight, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";

export function OfflineSyncTestWrapper() {
  const [logs, setLogs] = useState<string[]>([]);
  const [networkSimulated, setNetworkSimulated] = useState<boolean>(true); // true = online, false = offline

  // Ingest our custom hook to manage the local queue cache
  const [txQueue, setTxQueue, { isOnline, isHydrated }] = usePiLocalStorage<OfflineTx[]>(
    "bzr_offline_tx_queue",
    {
      defaultValue: [],
      syncOnNetworkRecover: true,
      syncEndpoint: "/api/node/sync-telemetry",
      onSyncSuccess: (data) => {
        addLog(`⚡ [SYNC SUCCESS] Sync daemon flushed ${data?.length || 0} pings successfully to bzr-db!`);
      }
    }
  );

  // Custom logger
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 14)]);
  };

  // Listen to standard window online/offline events for log output
  useEffect(() => {
    const handleOnline = () => addLog("ðŸŸ¢ OS reports device is ONLINE.");
    const handleOffline = () => addLog("ðŸ”´ OS reports device is OFFLINE.");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Force-toggle simulation (by overriding the online status or dispatching events)
  const toggleNetworkSimulation = () => {
    const nextState = !networkSimulated;
    setNetworkSimulated(nextState);
    
    // Dispatch native browser events so usePiLocalStorage hook intercepts them
    const eventName = nextState ? "online" : "offline";
    addLog(`ðŸ”§ [SIMULATOR] Forcing network event: "${eventName.toUpperCase()}"`);
    window.dispatchEvent(new Event(eventName));
  };

  // Push simulated heartbeats to our local storage queue
  const triggerSimulatedHeartbeat = () => {
    const newPing: OfflineTx = {
      txId: `tx_tele_${Math.floor(1000 + Math.random() * 9000)}`,
      type: "TELEMETRY_PING",
      payload: { 
        uptimeMinutes: 1, 
        lastActivityTimestamp: Date.now(),
        nodeId: "X570-FORGE-ACTIVE" 
      },
      timestamp: Date.now()
    };

    // If online, usePiLocalStorage will execute direct database write via API
    // If offline, usePiLocalStorage will store it on-device
    setTxQueue((prev) => [...prev, newPing]);
    
    if (networkSimulated) {
      addLog(`ðŸ“¤ [ONLINE] Transmitted telemetry ping ${newPing.txId} directly to Next.js API.`);
    } else {
      addLog(`ðŸ’¾ [OFFLINE] Network down! Buffered ${newPing.txId} in Pi Local Storage.`);
    }
  };

  // Manually trigger queue flush
  const forceManualFlush = async () => {
    if (txQueue.length === 0) {
      addLog("âš ï¸ [FLUSH] Local queue is already empty. Nothing to sync.");
      return;
    }
    
    if (!networkSimulated) {
      addLog("âŒ [FLUSH ABORTED] Cannot flush queue while simulated network is OFFLINE.");
      return;
    }

    addLog(`ðŸ”„ [FLUSH] Manually syncing ${txQueue.length} items to database...`);
    try {
      // Mocking the serverless API handshake
      const response = await fetch("/api/node/sync-telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: txQueue }),
      });

      if (response.ok) {
        addLog(`âœ… [FLUSH SUCCESS] Database acknowledged batch write concern. Clearing cache.`);
        setTxQueue([]);
      } else {
        throw new Error("Write concern acknowledgement rejected.");
      }
    } catch (err: any) {
      addLog(`âŒ [FLUSH ERROR] Sync failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-70 mx-auto font-mono text-xs text-slate-100 p-4 space-y-4">
      
      {/* Header */}
      <div className="border-b border-slate-900 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Activity className="text-indigo-500 animate-pulse" size={14} />
          <h2 className="text-xs font-bold uppercase tracking-tight">Offline Sync Auditor</h2>
        </div>
        <p className="text-[9px] text-slate-500 uppercase mt-0.5">S23 Ultra Staging Suite</p>
      </div>

      {/* Connection Dashboard Panel */}
      <div className="p-3 bg-slate-900/60 border border-slate-900 rounded-xl space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 uppercase text-[9px] font-bold">Network State:</span>
          <button 
            onClick={toggleNetworkSimulation}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition ${
              networkSimulated 
                ? "bg-emerald-950/80 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/50" 
                : "bg-rose-950/80 border border-rose-800 text-rose-400 hover:bg-rose-900/50"
            }`}
          >
            {networkSimulated ? <Wifi size={11} /> : <WifiOff size={11} />}
            <span className="text-[10px] uppercase">{networkSimulated ? "ONLINE" : "OFFLINE"}</span>
          </button>
        </div>

        {/* Local Storage Buffer Status */}
        <div className="flex justify-between items-center border-t border-slate-900 pt-2 text-[10px]">
          <span className="text-slate-500">Queue Buffer:</span>
          <span className={`font-bold font-mono px-1.5 py-0.5 rounded ${
            txQueue.length > 0 ? "bg-amber-950 text-amber-400" : "bg-slate-950 text-slate-400"
          }`}>
            {txQueue.length} Pending
          </span>
        </div>
      </div>

      {/* Dynamic Simulation Controls */}
      <div className="space-y-1.5">
        <button
          onClick={triggerSimulatedHeartbeat}
          className="w-full py-2.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-[10px] uppercase"
        >
          <ArrowUpRight size={12} />
          Simulate Heartbeat Ping
        </button>

        <button
          onClick={forceManualFlush}
          disabled={txQueue.length === 0 || !networkSimulated}
          className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-[10px] uppercase"
        >
          <RefreshCw size={11} />
          Force Queue Sync
        </button>
      </div>

      {/* Live System Logs (Truncated to avoid layout expansion on mobile viewports) */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pl-0.5">
          Console Output
        </span>
        <div className="h-32 bg-slate-950 border border-slate-900 rounded-xl p-2.5 overflow-y-auto space-y-1.5 font-mono text-[9px] leading-relaxed text-slate-400">
          {logs.length === 0 ? (
            <p className="text-slate-600 italic">No events recorded. Trigger telemetry inputs above...</p>
          ) : (
            logs.map((log, idx) => (
              <p key={idx} className="border-b border-slate-900/30 pb-1 last:border-b-0 break-all">
                {log}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Verification Legend */}
      <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-[9px] text-indigo-300 leading-normal space-y-1">
        <div className="flex items-center gap-1 font-bold">
          <CheckCircle size={10} className="text-indigo-400" />
          <span>SLA INTEGRITY SAFEGUARD</span>
        </div>
        <p className="text-slate-400 font-sans">
          Testing this flow verifies that local offline telemetry caches automatically dump their records to bzr-db when S23 connection recovers, protecting operator uptime logs [cite: 78].
        </p>
      </div>

    </div>
  );
}
