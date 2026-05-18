"use client";

// 🛡️ BAZAAR REPUBLIC: STASIS PROTOCOL UI INTERFACE
import { useState } from 'react';

export default function StasisShield({ pioneerUid }: { pioneerUid: string }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleStasisLock = async () => {
    setIsProcessing(true);
    console.log(`[MESH-INIT] Triggering Stasis Protocol for Node: ${pioneerUid}`);

    try {
      // 🔗 PI SDK INJECTION ZONE
      // This is where Pi.authenticate() and the Stellar transaction flow will be triggered.
      // For now, we simulate the network delay to ensure UI responsiveness.
      
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      // Simulate successful on-chain lock
      setIsLocked(true);
      console.log(`[MESH-SECURE] Contract state updated to FROZEN on Testnet.`);
      
    } catch (error) {
      console.error("[MESH-ERROR] Stasis transaction failed or rejected by Pioneer.", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 border-2 border-red-900 bg-black rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.5)]">
      <h2 className="text-xl font-bold text-red-500 mb-2">🛡️ MESH KILL-SWITCH</h2>
      <p className="text-sm text-gray-400 mb-4">
        Engage the Stasis Protocol to cryptographically freeze your E-Network node on the Stellar Testnet. 
        This action is immediate and severs all API database access.
      </p>
      
      <button
        onClick={handleStasisLock}
        disabled={isProcessing || isLocked}
        className={`w-full py-3 font-mono font-bold rounded transition-all duration-300 ${
          isLocked 
            ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-600"
            : "bg-red-600 hover:bg-red-700 text-white border border-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.8)]"
        }`}
      >
        {isProcessing ? "TRANSMITTING TO LEDGER..." : isLocked ? "NODE FROZEN (STASIS ACTIVE)" : "INITIATE SYSTEM LOCK"}
      </button>

      {/* Contract Verification Display */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500 font-mono text-center">
        TARGET: {process.env.NEXT_PUBLIC_STASIS_CONTRACT_ID?.substring(0, 8)}...{process.env.NEXT_PUBLIC_STASIS_CONTRACT_ID?.substring(48)}
      </div>
    </div>
  );
}