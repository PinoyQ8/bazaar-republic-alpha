"use client";

import { useState, useEffect } from "react";
import { useMeshStatus } from "@/app/components/MeshInitializer";
// 🛡️ BAZAAR TECH: Dual-Action Import
import { syncWalletAction, getWalletStatus } from "@/app/actions/wallet";

export default function WalletOnboardingShield() {
  const { user, isPiReady } = useMeshStatus();
  
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🛡️ BAZAAR TECH: Hydration State Flags
  const [isHydrating, setIsHydrating] = useState(true);
  const [securedWallet, setSecuredWallet] = useState<string | null>(null);

  // 🛡️ THE HYDRATION LOOP: Check Ledger on Mount
  useEffect(() => {
    const verifyLedgerState = async () => {
      if (user?.uid) {
        console.log(`[MESH-SCAN] Hydrating UI for Node: ${user.uid}`);
        const response = await getWalletStatus(user.uid);
        
        if (response.success && response.walletAddress) {
          setSecuredWallet(response.walletAddress);
        }
        setIsHydrating(false);
      }
    };

    if (isPiReady && user) {
      verifyLedgerState();
    }
  }, [isPiReady, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const identifier = user?.uid;
    if (!identifier) return;

    try {
      console.log(`[LEDGER WRITE] Initiating Wallet Sync for Node: ${identifier}`);
      const response = await syncWalletAction(identifier, walletAddress);
      
      if (!response.success) {
        throw new Error(response.error || "Ledger mutation failed.");
      }
      
      console.log("[MESH ALIGNMENT] Wallet successfully bound to Pioneer.");
      setSecuredWallet(walletAddress); // Instantly lock UI
      
    } catch (error) {
      console.error("[MESH FRACTURE] Wallet Sync Failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI LOCK 1: Booting or Hydrating
  if (!isPiReady || !user || isHydrating) {
    return (
      <div className="p-6 border border-amber-900/50 bg-amber-950/20 text-amber-500 font-mono animate-pulse">
        [MESH-SCAN] Syncing Ledger State...
      </div>
    );
  }

  // UI LOCK 2: Wallet Already Secured (Locked State)
  if (securedWallet) {
    const masked = `${securedWallet.substring(0, 6)}...${securedWallet.substring(securedWallet.length - 4)}`;
    return (
      <div className="bg-neutral-900 border border-emerald-900/50 p-6 font-mono">
        <h2 className="text-emerald-500 mb-2">VAULT LOCKED: NODE SECURED</h2>
        <div className="bg-neutral-950 p-4 border border-neutral-800 text-neutral-300 flex items-center justify-between">
          <span className="font-mono text-emerald-400">{masked}</span>
          <span className="text-emerald-500 text-xs tracking-widest border border-emerald-500/30 px-2 py-1 bg-emerald-950/30">SYNCED</span>
        </div>
      </div>
    );
  }

  // UI LOCK 3: Default Form
  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 font-mono">
      <h2 className="text-amber-500 mb-4">PIONEER WALLET ONBOARDING</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Enter Pi Wallet Address (Public Key)"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="bg-neutral-950 border border-neutral-700 p-3 text-neutral-300 focus:border-amber-500 outline-none"
          required
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-amber-900 text-amber-400 p-3 uppercase tracking-widest hover:bg-amber-800 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Writing to Ledger..." : "Sync Wallet"}
        </button>
      </form>
    </div>
  );
}