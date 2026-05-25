"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMeshTelemetry, upgradeBootstrapNodes } from "@/app/actions/telemetryActions";

export default function CommandCenterGate() {
  const { pioneer, isHydrated } = useAuth();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false); // 🛡️ SECTOR 3 STATE

  // 1. MESH-RADAR: Auto-Polling the Telemetry
  useEffect(() => {
    if (!isHydrated) return;

    async function fetchTelemetry() {
      const result = await getMeshTelemetry();
      if (result.success) {
        setTelemetry(result.data);
      }
      setLoading(false);
    }

    // Initial Fetch
    fetchTelemetry();

    // Active Radar: Refresh data every 15 seconds silently
    const radarSweep = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(radarSweep);
  }, [isHydrated]);

  // 2. 🛡️ MESH-CRON: Manual Ignition Switch
  async function handleForceUpgrade() {
    setIsExecuting(true);
    // Pass 'true' to trigger the Alpha-Track clock bypass (upgrades regardless of time)
    const res = await upgradeBootstrapNodes(true); 
    
    if (res.success) {
      console.log(res.message);
      // Force an immediate radar sweep to update the UI
      const refresh = await getMeshTelemetry();
      if (refresh.success) setTelemetry(refresh.data);
    }
    setIsExecuting(false);
  }

  // 3. MESH-RENDER STATES
  if (!isHydrated || loading) {
    return (
      <div className="bg-slate-950 p-6 min-h-screen flex flex-col justify-center items-center">
         <div className="text-emerald-500 font-mono animate-pulse">PULLING TELEMETRY FROM VAULT...</div>
      </div>
    );
  }

  if (!telemetry) {
    return (
      <div className="bg-slate-950 p-6 min-h-screen flex flex-col justify-center items-center">
         <div className="text-red-500 font-mono border border-red-900 bg-red-950/20 p-4 rounded">FRACTURE: UNABLE TO READ MESH DATA.</div>
      </div>
    );
  }

  const { metrics, roster } = telemetry;

  // 4. THE COMMAND DASHBOARD
  return (
    <div className="bg-slate-950 p-6 min-h-screen font-mono text-slate-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Sector */}
        <header className="mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-emerald-500 text-2xl uppercase tracking-widest font-bold mb-1">Sector 2: Command Center</h1>
          <div className="flex justify-between items-end">
            <p className="text-slate-500 text-sm">Operator Identity: <span className="text-slate-300">{pioneer.username || "Bazaar Tech"}</span></p>
            
            <div className="flex items-center gap-4">
              <p className="text-emerald-500/50 text-xs animate-pulse">● RADAR ACTIVE</p>
              
              {/* 🛡️ SECTOR 3 IGNITION SWITCH */}
              <button 
                onClick={handleForceUpgrade}
                disabled={isExecuting}
                className="bg-slate-800 hover:bg-emerald-900 border border-slate-700 text-xs text-slate-300 hover:text-emerald-400 px-3 py-1 rounded transition-colors disabled:opacity-50"
              >
                {isExecuting ? "EXECUTING PROTOCOL..." : "FORCE SYNC: UPGRADE NODES"}
              </button>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg">
            <div className="text-slate-500 text-xs mb-2 tracking-wider">GENESIS TARGET</div>
            <div className="text-3xl text-white font-bold">{metrics.totalNodes} <span className="text-lg text-slate-600 font-normal">/ {metrics.targetLimit}</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg">
            <div className="text-slate-500 text-xs mb-2 tracking-wider">TREASURY VAULT</div>
            <div className="text-3xl text-emerald-400 font-bold">{metrics.totalStake.toFixed(2)} <span className="text-sm font-normal">Test-Pi</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg">
            <div className="text-slate-500 text-xs mb-2 tracking-wider">VALIDATOR SHIELD</div>
            <div className="text-3xl text-blue-400 font-bold">{metrics.activeValidators} <span className="text-sm font-normal text-slate-500">Active Nodes</span></div>
          </div>
        </div>

        {/* MESH Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <h2 className="text-emerald-500 uppercase text-sm font-bold tracking-widest">Live Node Roster</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="p-4 font-normal w-1/4">Pioneer ID</th>
                  <th className="p-4 font-normal w-1/4">Public Address</th>
                  <th className="p-4 font-normal w-1/4">Vaulted Stake</th>
                  <th className="p-4 font-normal w-1/4">Protocol Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {roster.map((node: any) => (
                  <tr key={node._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-white">{node.pioneerId}</td>
                    <td className="p-4 text-slate-500">{node.publicAddress.substring(0, 12)}...</td>
                    <td className="p-4 font-bold text-emerald-500">{node.stakeAmount} Pi</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded border tracking-wider ${
                        node.kyc_status === 'VALIDATOR_ACTIVE' 
                          ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' 
                          : 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                      }`}>
                        {node.kyc_status}
                      </span>
                    </td>
                  </tr>
                ))}
                {roster.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No nodes secured in the Vault yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}