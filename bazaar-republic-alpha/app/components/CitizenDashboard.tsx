"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProviderById } from "@/app/actions/enetworkActions";
import { getNetworkTotalEquity } from "@/app/actions/defiActions";
import WalletOnboardingShield from "@/app/components/mesh/WalletOnboardingShield";
import PioneerHUD from "@/app/components/PioneerHUD";
import DeFiVault from "@/app/components/DeFiVault";
import MerchantPOS from "@/app/components/MerchantPOS";

export default function CitizenDashboard() {
  const { pioneer } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const handshake = async () => {
      // 1. Guard Clause: Release the UI lock if Node is unauthenticated
      if (!pioneer?.uid) {
        setWalletAddress("PENDING_ONBOARDING"); 
        setIsLoading(false); // <-- Seal the infinite loading vulnerability
        return;
      }

      // 2. Ledger Handshake
      try {
        const provider = await getProviderById(pioneer.uid);
        setWalletAddress(provider?.wallet_address || "PENDING_ONBOARDING");
      } catch (e) {
        console.error("[MESH-SCAN] Handshake Failure:", e);
        setWalletAddress("PENDING_ONBOARDING"); // Fallback to shield on error
      } finally {
        setIsLoading(false);
      }
    };
    handshake();
  }, [pioneer?.uid]);

  if (!pioneer) return <div className="p-8 text-zinc-500 font-mono">Awaiting Node Handshake...</div>;

  if (isLoading) return (
    <div className="p-8 text-emerald-500 font-mono">
      <p>[MESH-SCAN] Syncing ledger...</p>
      <button onClick={() => setIsLoading(false)} className="text-xs text-zinc-600 underline">
        [FORCE BYPASS]
      </button>
    </div>
  );

  if (walletAddress === "PENDING_ONBOARDING") return <WalletOnboardingShield />;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PioneerHUD />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MerchantPOS 
            merchantId="SYSTEM_DAO_COLLECTOR" 
            consumerId={pioneer?.uid ?? "GHOST_NODE"} 
          />
          <DeFiVault />
        </div>
      </div>
    </main>
  );
}