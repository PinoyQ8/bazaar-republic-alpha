"use client";
import { useState, useEffect } from "react";
import { registerSecurityCircle, getSecurityCircleStatus } from "@/app/actions/defiActions"; // 🟢 SECURED

export default function SecurityCircleHUD({ pioneerId }: { pioneerId: string }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: "error" | "success" | "system" } | null>(null);

  // 🛡️ THE UPLINK: Ledger Verification
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getSecurityCircleStatus(pioneerId).then((res: any) => { 
      if (isMounted) {
        // Strict Data Gate: Only set status if the node is actively enrolled
        if (res.success && res.data) {
          setStatus(res.data); 
        } else {
          setStatus(null);
        }
        setLoading(false); // 🛡️ RELEASES THE INFINITE LOADING LOCK
      }
    }).catch((error) => {
      console.error("[MESH-SCAN] Ledger Sync Failed", error);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [pioneerId]);

  // 🛡️ THE TRANSACTION SHIELD
  async function handleClientSubmit(formData: FormData) {
    if (isProcessing) return; // Prevent double-spending / spam clicks
    
    setIsProcessing(true);
    setFormMessage({ text: "ENCRYPTING PAYLOAD...", type: "system" });
    
    try {
      // 🛡️ ZERO-TRUST SHIELD: Pass the extracted string directly to the server action
const response = await registerSecurityCircle(pioneerId);
      
      if (response.success) {
         setFormMessage({ text: "TRANSACTION SECURED.", type: "success" });
         
         // Re-scan the node to update the UI from Form to Status View
         const updated = await getSecurityCircleStatus(pioneerId);
         if (updated.success && updated.data) {
            setStatus(updated.data);
         }
      } else {
         setFormMessage({ text: response.error || "TRANSACTION FAILED.", type: "error" });
      }
    } catch (error) {
      setFormMessage({ text: "FATAL: UPLINK FRACTURED.", type: "error" });
    } finally {
      setIsProcessing(false); // Release the button
    }
  }

  if (loading) {
    return (
      <div className="p-4 border border-zinc-800 bg-zinc-950/50 rounded-md text-zinc-500 font-mono text-sm animate-pulse text-center">
        [SYSTEM] SCANNING LEDGER FOR NODE IDENTITY...
      </div>
    );
  }

  // 🛡️ VIEW 1: NODE ALREADY ENROLLED
  if (status) {
    return (
      <div className="p-5 border border-emerald-900 bg-emerald-950/10 rounded-md font-mono text-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]">
        <h3 className="text-emerald-400 font-bold tracking-widest mb-4 uppercase border-b border-emerald-900/50 pb-2">
          Node Security: Active
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-500">KYC Status:</span>
            <span className="text-emerald-400 font-bold">{status.kyc_status || 'VERIFIED'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Active Stake:</span>
            <span className="text-zinc-200 font-bold">{status.stake_amount || status.stakeAmount || 0} mBZR</span>
          </div>
          <div className="pt-2 mt-2 border-t border-emerald-900/30">
            <span className="text-xs text-emerald-600 tracking-widest uppercase block text-center">Treasury Lock Verified</span>
          </div>
        </div>
      </div>
    );
  }

  // 🛡️ VIEW 2: STAKING INTERFACE
  return (
    <form action={handleClientSubmit} className="space-y-4 p-5 border border-zinc-800 bg-zinc-950 rounded-md font-mono text-sm">
      <h3 className="text-zinc-300 font-bold tracking-widest uppercase mb-4 border-b border-zinc-800 pb-2">
        Initialize Security Circle
      </h3>
      
      <input type="hidden" name="pioneerId" value={pioneerId} />
      
      <div>
        <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Burner Wallet Address</label>
        <input 
          name="publicAddress" 
          placeholder="e.g. GBZR...3X9F" 
          className="w-full bg-zinc-900 text-zinc-300 p-3 rounded border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors" 
          required 
          disabled={isProcessing}
        />
      </div>
      
      <div>
        <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Stake Amount (mBZR)</label>
        <input 
          name="stakeAmount" 
          type="number" 
          step="0.01"
          min="10"
          placeholder="Min. 10 mBZR" 
          className="w-full bg-zinc-900 text-zinc-300 p-3 rounded border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors" 
          required 
          disabled={isProcessing}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={isProcessing}
        className={`w-full p-3 rounded font-bold uppercase tracking-widest transition-all mt-2 ${
          isProcessing 
            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
            : "bg-emerald-900 hover:bg-emerald-800 text-emerald-400"
        }`}
      >
        {isProcessing ? "Encrypting Lock..." : "Enroll Node"}
      </button>

      {/* 🛡️ DYNAMIC RESPONSE TERMINAL */}
      {formMessage && (
        <div className={`text-xs p-3 border rounded mt-4 text-center tracking-widest ${
          formMessage.type === "error" ? "bg-red-950/20 border-red-900/50 text-red-500" :
          formMessage.type === "success" ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-500" :
          "bg-zinc-900 border-zinc-800 text-zinc-400"
        }`}>
          {formMessage.text}
        </div>
      )}
    </form>
  );
}