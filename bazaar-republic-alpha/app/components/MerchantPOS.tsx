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
    setStatus("SYNCING WITH MESH LEDGER...");
    setReceipt(null);
    
    try {
      // 🚀 EXECUTE THE HARDENED BACKEND ENGINE
      const result = await executeMarketTransaction(consumerId, merchantId, parseFloat(amount));
      
      // 🛡️ MESH PATCH: Safe dynamic unwrapping bypasses strict TS interface checking
      const safeResult = result as any; 

      if (safeResult.success) {
        setStatus(`🟢 SUCCESS: ${safeResult.message || "Settlement Complete"}`);
        setReceipt(safeResult.receipt || safeResult.data);
        setAmount("");
      } else {
        setStatus(`❌ FRACTURE: ${safeResult.error || safeResult.message || "Verification Failed"}`);
      }
    } catch (err) {
      setStatus("🚨 FATAL: POS Link unreachable. Check terminal logs.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl shadow-xl text-neutral-200 max-w-md font-mono text-xs">
      <h2 className="text-sm font-black text-amber-500 mb-4 border-b border-neutral-900 pb-2 uppercase tracking-widest">
        Bazaar E-Network POS
      </h2>
      
      <div className="space-y-2 mb-6 bg-neutral-900/40 p-3 rounded border border-neutral-800/50">
        <p>👤 <span className="text-neutral-500 uppercase tracking-wider">Consumer Node:</span> <span className="text-neutral-300">{consumerId}</span></p>
        <p>🏪 <span className="text-neutral-500 uppercase tracking-wider">Provider Node:</span> <span className="text-cyan-400">{merchantId}</span></p>
      </div>

      <div className="mb-4">
        <label className="block text-[10px] text-neutral-500 uppercase font-bold mb-1">Cart Value (mBZR)</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 1000"
          className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-amber-400 focus:border-amber-500 focus:outline-none transition-colors"
          disabled={processing}
        />
      </div>

      <button 
        onClick={handleSale}
        disabled={processing || !amount}
        className={`w-full py-3 font-black rounded uppercase tracking-widest transition-all text-[11px] ${
          processing 
            ? "bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700" 
            : "bg-amber-600 hover:bg-amber-500 text-neutral-950 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
        }`}
      >
        {processing ? "Executing..." : "Execute Settlement"}
      </button>

      {/* 🛡️ DYNAMIC AUDIT RECEIPT */}
      {status && (
        <div className={`mt-6 p-4 rounded border text-xs leading-relaxed ${
          status.includes('SUCCESS') 
            ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' 
            : status.includes('SYNCING')
            ? 'bg-blue-950/30 border-blue-900 text-blue-400 animate-pulse'
            : 'bg-rose-950/30 border-rose-900 text-rose-400'
        }`}>
          <p className="font-bold tracking-wide">{status}</p>
          
          {receipt && (
            <div className="mt-3 space-y-1.5 text-[10px] text-neutral-400 border-t border-neutral-800/60 pt-3">
              <div className="flex justify-between"><span className="text-neutral-500">Base Cart:</span> <span>{receipt.originalPrice} mBZR</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Consumer Paid:</span> <span className="text-cyan-400 font-bold">{receipt.buyerPaid} mBZR</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Provider Rx:</span> <span className="text-amber-400 font-bold">{receipt.merchantReceived} mBZR</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}