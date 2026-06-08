"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProviderById } from "@/app/actions/enetworkActions";
// 🛡️ BAZAAR TECH: Ensure this path matches your directory structure
// import WalletOnboardingShield from "@/app/components/mesh/WalletOnboardingShield";
import PioneerHUD from "@/app/components/PioneerHUD";
import DeFiVault from "@/app/components/DeFiVault";
import MerchantPOS from "@/app/components/MerchantPOS";

export default function CitizenDashboard() {
  const { pioneer } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [withdrawalStatus, setWithdrawalStatus] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    const handshake = async () => {
      if (!pioneer?.uid) {
        setWalletAddress("PENDING_ONBOARDING");
        setIsLoading(false);
        return;
      }

      try {
        const provider = await getProviderById(pioneer.uid);
        setWalletAddress(provider?.walletAddress || "PENDING_ONBOARDING");
      } catch (e) {
        console.error("[MESH-SCAN] Handshake Failure:", e);
        setWalletAddress("PENDING_ONBOARDING");
      } finally {
        setIsLoading(false);
      }
    };
    handshake();
  }, [pioneer?.uid]);

  const handleWithdrawalRequest = async (amount: number, recipientAddress: string) => {
    try {
      setWithdrawalStatus("Initiating cryptographic transaction...");
      setCountdown(null);

      const response = await fetch('/api/mesh/vault/secure-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INITIATE_WITHDRAWAL',
          amount,
          recipient: recipientAddress,
          signature: 'MOCK_PI_WALLET_PASSPHRASE_SIG' 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setWithdrawalStatus(`❌ Error: ${data.error || 'Transaction rejected'}`);
        return;
      }

      if (data.status === 'TIMELOCK_ENGAGED') {
        setWithdrawalStatus(`⚠️ TIMELOCK ACTIVE: ${data.message}`);
        setCountdown(`Unlocks at: ${new Date(data.unlocksAt).toLocaleTimeString()}`);
      } else {
        setWithdrawalStatus(`✅ Transaction authorized.`);
      }
    } catch (error) {
      setWithdrawalStatus("❌ System integration link failure.");
    }
  };

  if (!pioneer) return <div className="p-8 text-zinc-500 font-mono">[!] Awaiting Node Handshake...</div>;

  if (isLoading) return (
    <div className="p-8 text-emerald-500 font-mono">
      <p>[MESH-SCAN] Syncing ledger...</p>
    </div>
  );

  // 🛡️ IDENTITY GATE: If no wallet, trigger the shield (Currently Disabled)
// if (walletAddress === "PENDING_ONBOARDING") return <WalletOnboardingShield />;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PioneerHUD />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MerchantPOS 
  merchantId="SYSTEM_DAO_COLLECTOR" 
  consumerId={pioneer?.uid ?? "GHOST_NODE"} 
/>
          
          <div className="space-y-6">
            <DeFiVault />
            <div className="p-6 bg-zinc-900 border border-red-950 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-sm font-bold uppercase text-red-500">🔒 Citizen Vault Defense Grid</h3>
                <span className="text-[10px] bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded">ZERO TRUST</span>
              </div>
              <p className="text-xs text-zinc-400">Simulate high-volume drain to engage defensive escrow.</p>
              
              <button 
                onClick={() => handleWithdrawalRequest(5000, 'GD_MALICIOUS_EXPLOIT_TARGET')}
                className="w-full px-4 py-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 rounded text-xs font-semibold uppercase tracking-wide transition-all"
              >
                Simulate Exploitive Drain Check
              </button>

              {withdrawalStatus && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                  <p className="text-xs font-mono text-yellow-500">{withdrawalStatus}</p>
                  {countdown && <p className="text-[11px] text-zinc-500 font-mono">{countdown}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}