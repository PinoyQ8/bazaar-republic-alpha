"use client";

import React, { useState } from "react";
import { executeMarketTransaction } from "@/app/actions/merchantActions";

interface MerchantPOSProps {
  merchantId: string;
  consumerId: string;
}

export default function MerchantPOS({ merchantId, consumerId }: MerchantPOSProps) {
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any>(null);

  const handleSale = async () => {
    if (!amount || isNaN(Number(amount))) {
      setStatus("FRACTURE: Invalid numeric cart value.");
      return;
    }
    
    setProcessing(true);
    setStatus("Syncing with MESH Ledger...");
    setReceipt(null);
    
    try {
      // 🚀 EXECUTE THE HARDENED BACKEND ENGINE
      const result = await executeMarketTransaction(consumerId, merchantId, parseFloat(amount));
      
      if (result.success) {
        setStatus(`🟢 SUCCESS: ${result.message}`);
        setReceipt(result.receipt);
        setAmount("");
      } else {
        setStatus(`❌ FRACTURE: ${result.message}`);
      }
    } catch (err) {
      setStatus("🚨 FATAL: POS Link unreachable. Check terminal logs.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 border border-cyan-500 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.2)] text-white max-w-md font-mono">
      <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-gray-700 pb-2">
        Bazaar E-Network POS
      </h2>
      
      <div className="space-y-4 mb-6 text-sm text-gray-300">
        <p>👤 <span className="font-semibold text-gray-400">Buyer:</span> {consumerId}</p>
        <p>🏪 <span className="font-semibold text-gray-400">Merchant:</span> {merchantId}</p>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-cyan-500 uppercase mb-2">Cart Value (mBZR)</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 1000"
          className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-cyan-400 focus:outline-none"
          disabled={processing}
        />
      </div>

      <button 
        onClick={handleSale}
        disabled={processing || !amount}
        className={`w-full py-3 font-bold rounded uppercase tracking-widest transition-all ${
          processing 
            ? "bg-gray-700 text-gray-500 cursor-not-allowed" 
            : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(0,255,255,0.3)]"
        }`}
      >
        {processing ? "Processing..." : "Execute Settlement"}
      </button>

      {/* 🛡️ DYNAMIC AUDIT RECEIPT */}
      {status && (
        <div className={`mt-6 p-4 rounded text-sm ${status.includes('SUCCESS') ? 'bg-green-900/30 border border-green-500 text-green-400' : 'bg-red-900/30 border border-red-500 text-red-400'}`}>
          <p className="font-bold mb-2">{status}</p>
          
          {receipt && (
            <div className="mt-2 space-y-1 text-xs font-mono text-gray-300 border-t border-gray-700 pt-2">
              <p>Base Cart: {receipt.originalPrice} mBZR</p>
              <p className="text-cyan-400">Buyer Paid: {receipt.buyerPaid} mBZR (Subsidized)</p>
              <p className="text-yellow-400">Merchant Rx: {receipt.merchantReceived} mBZR (Taxed)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}