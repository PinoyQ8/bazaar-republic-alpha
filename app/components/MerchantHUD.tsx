"use client"; // Must be on Line 1

import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import { executeMarketTransaction } from "@/app/actions/marketActions";

export default function MerchantHUD() {
  const { pioneer } = useAuth();
  const [buyerId, setBuyerId] = useState("");
  const [cartValue, setCartValue] = useState("");
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    // 🛡️ ZERO-TRUST GATE
    if (!pioneer.username || pioneer.username === "DISCONNECTED_NODE") {
      setError("MESH-REJECT: Merchant Node is not authenticated.");
      return;
    }
    if (!buyerId || !cartValue || Number(cartValue) <= 0) {
      setError("MESH-REJECT: Invalid payload parameters.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setReceipt(null);

    try {
      // 🚀 EXECUTE ATOMIC SETTLEMENT
      const response = await executeMarketTransaction(buyerId, pioneer.username, Number(cartValue));
      
      if (response.success) {
        setReceipt(response.receipt);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("FATAL: Treasury Database Unreachable.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md p-6 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-zinc-100">
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-emerald-400 font-bold tracking-widest uppercase text-sm">
          Sector 2: Merchant Terminal
        </h2>
        <p className="text-zinc-500 text-xs mt-1">E-Network Dynamic Subsidy Engine Active</p>
      </div>

      {/* 🛡️ INPUT GATES */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Buyer Node (Username)</label>
          <input 
            type="text" 
            value={buyerId}
            onChange={(e) => setBuyerId(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-emerald-300 focus:outline-none focus:border-emerald-500"
            placeholder="e.g., Mommydors"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Cart Value (mBZR)</label>
          <input 
            type="number" 
            value={cartValue}
            onChange={(e) => setCartValue(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-emerald-300 focus:outline-none focus:border-emerald-500"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* 🛡️ EXECUTION TRIGGER */}
      <button 
        onClick={handleCheckout}
        disabled={isProcessing}
        className={`w-full py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${
          isProcessing 
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
            : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950"
        }`}
      >
        {isProcessing ? "Processing Block..." : "Execute Atomic Swap"}
      </button>

      {/* 🚨 FRACTURE ALERT */}
      {error && (
        <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* 📊 ZERO-TRUST RECEIPT */}
      {receipt && (
        <div className="mt-6 p-4 bg-zinc-900 border border-emerald-900/50 rounded text-xs space-y-2">
          <h3 className="text-emerald-400 font-bold mb-3 border-b border-zinc-800 pb-2">TRANSACTION SECURED</h3>
          
          <div className="flex justify-between">
            <span className="text-zinc-500">Base Price:</span>
            <span>{receipt.originalPrice.toFixed(2)} mBZR</span>
          </div>
          
          <div className="flex justify-between text-emerald-300">
            <span className="text-zinc-500">DAO Discount Applied (Buyer TS):</span>
            <span>- {receipt.discountApplied.toFixed(2)} mBZR</span>
          </div>
          
          <div className="flex justify-between text-emerald-300">
            <span className="text-zinc-500">DAO Tax Break (Merchant TS):</span>
            <span>+ {receipt.taxCollected.toFixed(2)} mBZR Retained</span>
          </div>
          
          <div className="pt-2 mt-2 border-t border-zinc-800 flex justify-between font-bold text-sm text-zinc-100">
            <span>Buyer Paid:</span>
            <span>{receipt.buyerPaid.toFixed(2)} mBZR</span>
          </div>
        </div>
      )}
    </div>
  );
}