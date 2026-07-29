"use client";

import React, { useState } from "react";
import { initiateMeshPayment } from "@/app/utils/meshPiBridge";
import { Zap, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FuelPump({ pioneerId }: { pioneerId: string }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ msg: string; type: 'idle' | 'success' | 'error' }>({ msg: "", type: "idle" });

  const handlePurchase = async () => {
    setIsProcessing(true);
    setStatus({ msg: "Initiating Pi Bridge...", type: "idle" });
    
    try {
      // 🛡️ Requesting to buy 1 Pi worth of MESH Fuel
      const result: any = await initiateMeshPayment(1, "MESH DAO Fuel Stake", pioneerId);
      
      if (result.success) {
        setStatus({ msg: `YIELD DELIVERED: ${result.newFuelBalance} Fuel Active`, type: "success" });
        router.refresh(); // Forces Next.js to update the dashboard metrics
      } else {
        setStatus({ msg: `ADJUDICATOR HALT: ${result.error}`, type: "error" });
      }
    } catch (err: any) {
      setStatus({ msg: err.message === "PAYMENT_CANCELLED" ? "Transaction aborted." : `FRACTURE: ${err.message}`, type: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-5 border border-amber-900/50 bg-neutral-900/40 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-mono text-sm font-bold text-amber-500 tracking-widest uppercase">Vault Stake</h3>
          <p className="font-mono text-[10px] text-neutral-500 tracking-widest uppercase mt-1">Convert Pi to MESH Fuel</p>
        </div>
        <div className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs rounded">
          1.00 π = 10 FUEL
        </div>
      </div>

      <button 
        onClick={handlePurchase}
        disabled={isProcessing}
        className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-black text-xs tracking-widest uppercase rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
      >
        {isProcessing ? (
          <><Loader2 size={16} className="animate-spin" /> SYNCHRONIZING LEDGER...</>
        ) : (
          <><Zap size={16} /> INJECT FUEL STAKE</>
        )}
      </button>

      {status.type !== "idle" && (
        <div className={`mt-3 p-3 text-[10px] tracking-widest uppercase font-mono rounded flex items-start gap-2 border ${status.type === 'success' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-red-950/20 border-red-900 text-red-400'}`}>
          {status.type === 'success' ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
          {status.msg}
        </div>
      )}
    </div>
  );
}