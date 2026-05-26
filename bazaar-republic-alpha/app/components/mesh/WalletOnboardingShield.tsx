"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext"; // 🛡️ Master context hook
import { updateProviderWallet } from "@/app/actions/enetworkActions"; // 🛡️ DIRECT ACTION HOOK INJECTED

export default function WalletOnboardingShield() {
  const [wallet, setWallet] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ Connect to the active authentication channel to fetch the validated user token
  const { pioneer } = useAuth() as any;

  // The cryptographically secure Stellar/Pi regex: Starts with G, 56 chars total
  const isValid = /^G[A-Z2-7]{55}$/.test(wallet);

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    
    try {
      // 1. Extract the secure identifier from the context payload
      const identifier = pioneer?._id || pioneer?.uid || pioneer?.username;
      
      if (!identifier) {
        console.error("[MESH-SCAN] 🚨 No Pioneer Identity found in active Auth Context.");
        setIsSubmitting(false);
        return;
      }

      console.log(`[MESH-BRIDGE] 🛰️ Initiating Wallet Sync for Node: ${identifier}`);

      // 2. 🛡️ SERVER ACTION EXECUTION: Bypass /api/ completely
      const result = await updateProviderWallet(identifier, wallet);

      if (result && result.success) {
        console.log("[MESH-BRIDGE] 🟢 Wallet mapping verified and written to ledger.");
        window.location.reload(); // Hard refresh to lift the shield
      } else {
        console.error("MESH-SCAN: Wallet Update Failed -", result?.message || "Unknown State");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("MESH-SCAN: Critical Submission Fracture", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-4 backdrop-blur-md">
      <div className="w-full max-w-[384px] bg-zinc-950 border border-amber-500 p-6 rounded shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <h2 className="text-amber-500 font-bold text-lg mb-2 flex items-center tracking-wider">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          NODE ISOLATION ACTIVE
        </h2>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
          Your Pi identity is verified, but your routing address is PENDING. Submit your public Pi Wallet Address (56 characters, starting with G) to access the E-Network.
        </p>
        
        <input 
          type="text" 
          value={wallet}
          onChange={(e) => setWallet(e.target.value.toUpperCase().trim())}
          placeholder="G..."
          className="w-full bg-zinc-900 border border-zinc-700 text-amber-500 font-mono text-xs p-3 focus:outline-none focus:border-amber-500 transition-colors mb-4"
        />

        <button 
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`w-full p-3 font-bold text-sm tracking-widest transition-all ${
            isValid 
              ? "bg-amber-500 text-zinc-950 hover:bg-amber-400" 
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "SYNCING..." : "VERIFY WALLET"}
        </button>
      </div>
    </div>
  );
}