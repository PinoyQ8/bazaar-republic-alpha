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
      if (!pioneer?.uid) return;
      
      try {
        const provider = await getProviderById(pioneer.uid);
        setWalletAddress(provider?.wallet_address || "PENDING_ONBOARDING");
      } catch (e) {
        console.error("[MESH-SCAN] Handshake Failure:", e);
      } finally {
        setIsLoading(false);
      }
    };

    handshake();
  }, [pioneer?.uid]);

  // 1. AWAITING HANDSHAKE
  if (!pioneer) return <div className="p-8 text-zinc-500 font-mono">Awaiting Node Handshake...</div>;

  // 2. LOADING STATE
  if (isLoading) return <div className="p-8 text-emerald-500 font-mono">SYNCHRONIZING MESH LEDGER...</div>;

  // 3. ZERO-TRUST SECURITY GATE
  if (walletAddress === "PENDING_ONBOARDING") return <WalletOnboardingShield />;

  // 4. ACTIVE COMMAND CENTER
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PioneerHUD />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MerchantPOS 
            merchantId="SYSTEM_DAO_COLLECTOR" 
            consumerId={pioneer.uid ?? "GHOST_NODE"} 
          />
          <DeFiVault />
        </div>
      </div>
    </main>
  );
}