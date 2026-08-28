'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext'; 

interface HUDState {
  totalEquity: number;
  activeFuel: number;
  vestingShield: number;
  healthFactor: number;
}

export default function PioneerHUD() {
  const { pioneer } = useAuth(); 
  const [hudData, setHudData] = useState<HUDState>({
    totalEquity: 0,
    activeFuel: 0,
    vestingShield: 0,
    healthFactor: 150,
  });

  // 🛡️ THE MESH LOCKS: Hardware-level throttling
  const alertGate = useRef(false);
  const syncInProgress = useRef(false);
  const lastSyncTime = useRef(0);
  
  const activeNodeId = pioneer?.username || pioneer?.uid;

  useEffect(() => {
    // Hydration Shield
    if (!activeNodeId) return;

    const fetchTelemetry = async () => {
      const now = Date.now();
      
      // 🛡️ THE THROTTLE SHIELD: 
      // Block request if one is active OR if less than 2000ms has passed since the last pull
      if (syncInProgress.current || now - lastSyncTime.current < 2000) {
        return; 
      }

      syncInProgress.current = true; // Lock the gate

      try {
        const res = await fetch(`/api/mesh-scan/pioneer-data?id=${activeNodeId}`);
        if (!res.ok) throw new Error('Uplink failed');
        const payload = await res.json();

        setHudData({
          totalEquity: payload.data?.totalEquity || 0,
          activeFuel: payload.data?.activeFuel || 0,
          vestingShield: payload.data?.vestingShield || 0,
          healthFactor: payload.data?.healthFactor || 0,
        });

        // PWA Notification Trigger
        if (payload.data?.vestingShield > 0 && !alertGate.current) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('MESH Uptime Shield Active', {
              body: 'Yield Unlocked. Access your secure dashboard to claim.',
              icon: '/mesh-icon.png' 
            });
          }
          alertGate.current = true; 
        }
        
        lastSyncTime.current = Date.now(); // Update the timestamp only on success
      } catch (error) {
        console.error('[MESH_SCAN] HUD Sync Interrupted.');
      } finally {
        syncInProgress.current = false; // Release the lock
      }
    };

    // Initial Pull
    fetchTelemetry();

    // THE MESH HEARTBEAT: 10-Second Autonomous Uplink
    const syncInterval = setInterval(fetchTelemetry, 10000); 

    // Cleanup
    return () => clearInterval(syncInterval);
  }, [activeNodeId]); // The hooks will fire, but the Throttle Shield will deflect the spam

  return (
    <div className="flex flex-col items-center w-full max-w-[384px] p-6 bg-zinc-950 text-white font-mono border border-zinc-800 rounded-lg shadow-2xl">
      {/* MACRO VIEW: Total Equity */}
      <div className="text-center mb-6">
        <h2 className="text-zinc-400 text-sm tracking-widest uppercase mb-1">Total Network Equity</h2>
        <div className="text-4xl font-bold text-emerald-400">
          {hudData.totalEquity.toFixed(2)} <span className="text-lg text-emerald-600">Test-Pi</span>
        </div>
        
        {/* Dynamic Health Shield Indicator */}
        <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full inline-block ${
          hudData.healthFactor >= 150 ? 'bg-emerald-900/50 text-emerald-400' :
          hudData.healthFactor >= 125 ? 'bg-amber-900/50 text-amber-400' :
          'bg-red-900/50 text-red-400'
        }`}>
          SHIELD HEALTH: {hudData.healthFactor}%
        </div>
      </div>

      <div className="w-full h-px bg-zinc-800 mb-6"></div>

      {/* MICRO VIEW: The Tranche Split */}
      <div className="w-full space-y-4">
        {/* Tranche 1: Circulating Fuel */}
        <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-md border border-zinc-700/50">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">🟢</span>
            <span className="text-sm text-zinc-300 uppercase tracking-wide">Active Fuel</span>
          </div>
          <div className="font-bold">{hudData.activeFuel.toFixed(2)}</div>
        </div>

        {/* Tranche 2: Vesting Yield Shield */}
        <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-md border border-zinc-700/50">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">🔒</span>
              <span className="text-sm text-zinc-300 uppercase tracking-wide">Vesting Shield</span>
            </div>
            {hudData.vestingShield > 0 && (
               <span className="text-xs text-zinc-500 mt-1 ml-6">Unlocks in 71h 45m</span>
            )}
          </div>
          <div className="font-bold text-amber-400">{hudData.vestingShield.toFixed(2)}</div>
        </div>
      </div>

      {/* MANUAL PULL ARCHITECTURE: The Claim Button */}
      <button 
        disabled={true} 
        className="mt-6 w-full py-3 bg-zinc-800 text-zinc-500 font-bold tracking-widest uppercase rounded-md border border-zinc-700 cursor-not-allowed transition-all disabled:opacity-50"
      >
        Claim MESH Yield
      </button>
    </div>
  );
}