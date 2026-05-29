"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProviderById } from "@/app/actions/enetworkActions";
import { getNetworkTotalEquity } from "@/app/actions/defiActions";
import WalletOnboardingShield from "@/app/components/mesh/WalletOnboardingShield";
import PioneerHUD from "@/app/components/PioneerHUD";
import DeFiVault from "@/components/DeFiVault";
import MerchantPOS from "@/components/MerchantPOS";

interface PioneerStatus {
  status: 'NULL' | 'BOOTSTRAP_LOCKED' | 'VALIDATOR_ACTIVE';
  contract_id: string;
  wallet_address?: string;
}

export default function CitizenDashboard() {
  const { pioneer } = useAuth();
  const [pioneerState, setPioneerState] = useState<PioneerStatus | null>(null);
  const [totalEquity, setTotalEquity] = useState<number>(0);

  // 🛡️ PRIMITIVE EXTRACTION: Prevents referential loop fractures
  const activeNodeId = pioneer?.username;

  useEffect(() => {
    let isMounted = true; // Mount Guard

    const syncNodeLedger = async () => {
      // Gatekeeper: Do not fetch if the node identity is missing
      if (!activeNodeId) return; 

      // 1. Fetch Network Equity
      try {
        const equityData = await getNetworkTotalEquity();
        if (isMounted && equityData.success) setTotalEquity(equityData.total);
      } catch (e) { 
        console.error("[MESH_SCAN] Equity Sync Failed"); 
      }

      // 2. Fetch Provider Data
      let wallet_address = "PENDING_ONBOARDING";
      try {
        const providerData = await getProviderById(activeNodeId);
        if (providerData?.wallet_address) {
          wallet_address = providerData.wallet_address;
        }
      } catch (error) {
        console.error("[MESH_SCAN] Ledger sync failed", error);
      }

      // 3. Lock State
      if (isMounted) {
        setPioneerState({ 
          status: 'VALIDATOR_ACTIVE', 
          contract_id: 'CA_MESH_001',
          wallet_address 
        });
      }
    };

    syncNodeLedger();

    // Cleanup function to lock the mount guard
    return () => {
      isMounted = false;
    };
  }, [activeNodeId]); // 🛡️ STRICT DEPENDENCY: Only re-runs if the Node ID string changes

  // LOADING STATE
  if (!pioneerState) return <div className="text-emerald-500 p-8 font-mono">SYNCING WITH LEDGER...</div>;

  // ZERO-TRUST SHIELD
  if (pioneerState.wallet_address === "PENDING_ONBOARDING") {
    return <WalletOnboardingShield />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-widest text-emerald-400 uppercase">E-Network Command Center</h1>
            <p className="text-xs text-zinc-500 mt-1">Node: {activeNodeId || "AWAITING_HANDSHAKE"}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-zinc-500 uppercase">Network Equity</p>
            <p className="text-lg font-bold text-emerald-500">{totalEquity.toLocaleString()} mBZR</p>
          </div>
        </header>

        <div className="mb-6 p-4 border border-emerald-900/50 bg-emerald-950/20 rounded font-mono text-xs">
          <h3 className="text-emerald-400 font-bold uppercase mb-1">Status: Decentralized Simulation Active</h3>
          <p className="text-emerald-600">
            Welcome, Pioneer. You are currently operating within the MESH Protocol Stress-Test Environment. 
            All mBZR stakes and treasury actions are simulated for network readiness. 
            Real-time ledger synchronization is active.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PioneerHUD />
            <MerchantPOS merchantId="SYSTEM_DAO_COLLECTOR" consumerId={activeNodeId || "GHOST_NODE"} />
          </div>
          <div className="space-y-6">
            <DeFiVault />
          </div>
        </div>
      </div>
    </main>
  );
}