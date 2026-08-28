"use client";

import { useState, useEffect } from "react";
import { registerSecurityCircle, getSecurityCircleStatus } from "@/app/actions/defiActions";

interface SecurityStatus {
  _id?: string;
  pioneerId?: string;
  publicAddress?: string;
  vaultBalance?: number;
  stake_amount?: number;
  stakeAmount?: number;
  kyc_status?: string;
  lastStakeTimestamp?: string | Date;
}

// 🛡️ SANITIZATION BRIDGE
const sanitize = (data: any): SecurityStatus => ({
  ...data,
  _id: data._id?.toString(),
  lastStakeTimestamp: data.lastStakeTimestamp instanceof Date 
    ? data.lastStakeTimestamp.toISOString() 
    : data.lastStakeTimestamp
});

export default function SecurityCircleHUD({ pioneerId }: { pioneerId: string }) {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: "error" | "success" | "system" } | null>(null);

  useEffect(() => {
    // 🛡️ BAZAAR TECH: Fetching only when PioneerId is anchored
    if (!pioneerId) return;
    
    getSecurityCircleStatus(pioneerId)
      .then((res: any) => {
        if (res.success && res.data) {
          setStatus(sanitize(res.data));
        }
      })
      .finally(() => setLoading(false));
  }, [pioneerId]);

  async function handleClientSubmit(formData: FormData) {
    setIsProcessing(true);
    try {
      const publicAddress = formData.get("publicAddress") as string;
      const stakeAmount = parseFloat(formData.get("stakeAmount") as string);
      
      // 🛡️ AUTHENTICATED MUTATION
      const response = await registerSecurityCircle({ pioneerId, publicAddress, stakeAmount });
      
      if (response.success) {
        setFormMessage({ text: "TRANSACTION SECURED.", type: "success" });
        const updated = await getSecurityCircleStatus(pioneerId);
        if (updated.success) setStatus(sanitize(updated.data));
      } else {
        throw new Error(response.error);
      }
    } catch (err: any) {
      setFormMessage({ text: err.message || "UPLINK FRACTURED.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) {
    return <div className="p-4 border border-zinc-800 bg-zinc-950/50 rounded-md text-zinc-500 font-mono text-sm animate-pulse text-center">[SYSTEM] SCANNING LEDGER...</div>;
  }

  if (status) {
    return (
      <div className="p-5 border border-emerald-900 bg-emerald-950/10 rounded-md font-mono text-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]">
        <h3 className="text-emerald-400 font-bold tracking-widest mb-4 uppercase border-b border-emerald-900/50 pb-2">Node Security: Active</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-500">KYC Status:</span>
            <span className="text-emerald-400 font-bold">{status.kyc_status || 'VERIFIED'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Active Stake:</span>
            <span className="text-zinc-200 font-bold">{status.stake_amount || status.stakeAmount || 0} mBZR</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={handleClientSubmit} className="space-y-4 p-5 border border-zinc-800 bg-zinc-950 rounded-md font-mono text-sm">
      <h3 className="text-zinc-300 font-bold tracking-widest uppercase mb-4 border-b border-zinc-800 pb-2">Initialize Security Circle</h3>
      <input type="hidden" name="pioneerId" value={pioneerId} />
      <div>
        <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Burner Wallet Address</label>
        <input name="publicAddress" className="w-full bg-zinc-900 text-zinc-300 p-3 rounded border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors" required disabled={isProcessing} />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Stake Amount (mBZR)</label>
        <input name="stakeAmount" type="number" step="0.01" min="10" className="w-full bg-zinc-900 text-zinc-300 p-3 rounded border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors" required disabled={isProcessing} />
      </div>
      <button type="submit" disabled={isProcessing} className="w-full p-3 rounded font-bold uppercase tracking-widest transition-all mt-2 bg-emerald-900 hover:bg-emerald-800 text-emerald-400">
        {isProcessing ? "Encrypting Lock..." : "Enroll Node"}
      </button>
      {formMessage && (
        <div className={`text-xs p-3 border rounded mt-4 text-center tracking-widest ${formMessage.type === "error" ? "bg-red-950/20 text-red-500" : "bg-emerald-950/20 text-emerald-500"}`}>
          {formMessage.text}
        </div>
      )}
    </form>
  );
}