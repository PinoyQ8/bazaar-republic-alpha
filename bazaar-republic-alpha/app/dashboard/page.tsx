"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import WalletOnboardingShield from "@/app/components/mesh/WalletOnboardingShield";
import { getProviderById } from "@/app/actions/enetworkActions";

// 🛡️ THE MESH UPLINK IMPORTS
import PioneerHUD from "@/app/components/PioneerHUD";
import DeFiVault from "@/components/DeFiVault"; // ◄ INJECTED: The Secondary Market

interface PioneerStatus {
  status: 'NULL' | 'BOOTSTRAP_LOCKED' | 'VALIDATOR_ACTIVE';
  contract_id: string;
  wallet_address?: string;
}

export default function DashboardTrafficController() {
  const { pioneer } = useAuth();
  const [pioneerState, setPioneerState] = useState<PioneerStatus | null>(null);

  useEffect(() => {
    const syncNodeLedger = async () => {
      // Default to pending lock until proven otherwise
      let wallet_address = "PENDING_ONBOARDING";

      // Fetch the actual Provider database profile to check wallet status
      if (pioneer?.username) {
        try {
          const providerData = await getProviderById(pioneer.username);
          if (providerData && providerData.wallet_address) {
            wallet_address = providerData.wallet_address;
          }
        } catch (error) {
          console.error("MESH_SCAN: Failed to sync Provider data", error);
        }
      }

      setPioneerState({ 
        status: 'VALIDATOR_ACTIVE', 
        contract_id: 'CA_MESH_001',
        wallet_address 
      });
    };
    syncNodeLedger();
  }, [pioneer]);

  if (!pioneerState) return <div className="text-emerald-500 p-8 font-mono">SYNCING WITH LEDGER...</div>;

  if (pioneerState.status === 'NULL') {
    return <div className="p-8 text-emerald-500 border border-emerald-500 font-mono">INITIATING SOROBAN STAKING...</div>;
  }

  if (pioneerState.status === 'BOOTSTRAP_LOCKED') {
    return <div className="p-8 text-amber-500 font-mono">TRANSACTION PENDING IN LEDGER...</div>;
  }

  // --- ZERO-TRUST WALLET SHIELD INJECTION ---
  if (pioneerState.wallet_address === "PENDING_ONBOARDING") {
    return <WalletOnboardingShield />;
  }

  // --- PHASE 4: COMMAND CENTER (Verified Block) ---
  return (
    <div className="bg-slate-950 min-h-screen text-slate-300 max-w-[384px] mx-auto border-x border-slate-900">
      <nav className="p-6 border-b border-emerald-900/50 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-emerald-500 uppercase tracking-widest">Bazaar Republic</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Node: {pioneer?.username || "PioneerNode"}</p>
        </div>
      </nav>

      <main className="p-6 grid gap-6">
        <div className="border border-emerald-900/30 p-3 font-mono text-xs text-center bg-emerald-950/20 text-emerald-400 tracking-widest">
          COMMAND CENTER ACTIVE
        </div>
        
        {/* ========================================= */}
        {/* THE PRIMARY MARKET: TRI-ASSET HUD         */}
        {/* ========================================= */}
        <PioneerHUD />
        
        {/* ========================================= */}
        {/* THE SECONDARY MARKET: DEFI STAKING        */}
        {/* ========================================= */}
        <DeFiVault />

      </main>

      <footer className="p-6 mt-10 border-t border-emerald-900/50">
        <p className="text-xs text-slate-500 tracking-wider font-mono">
          LEDGER-VERIFIED: {pioneerState.contract_id}
        </p>
      </footer>
    </div>
  );
}