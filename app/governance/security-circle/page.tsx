"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { registerSecurityCircle, getSecurityCircleStatus } from "@/app/actions/defiActions";

export default function SecurityCircleGate() {
  const context = useAuth() as any; // 🛡️ MESH-CAST: Resolving context
  const pioneer = context.pioneer;
  const isHydrated = context.isHydrated as boolean;
  const router = useRouter();
  
  const [address, setAddress] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [nodeData, setNodeData] = useState<any>(null); 
  const [loadingDb, setLoadingDb] = useState(true);

  // 🛡️ MESH-BOOTSTRAP CONSTANTS
  const STAKE_AMOUNT = 10.00; 

  useEffect(() => {
    if (!isHydrated) return;

    async function checkStatus() {
      if (pioneer?.username) {
        const result = await getSecurityCircleStatus(pioneer.username);
        if (result.success) {
          setNodeData(result.data);
        }
      }
      setLoadingDb(false);
    }
    
    checkStatus();
  }, [isHydrated, pioneer?.username]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);

    try {
      const pi = (window as any).Pi;
      if (!pi) throw new Error("MESH-FRACTURE: Pi SDK not detected.");

      const paymentData = {
        amount: STAKE_AMOUNT,
        memo: "Genesis 100 Bootstrap Stake", 
        metadata: { pioneerId: pioneer.username }
      };

      const callbacks = {
        onReadyForServerApproval: (paymentId: string) => {
          console.log("[MESH-TX] Vaulting initialized. Payment ID:", paymentId);
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
  console.log("[MESH-TX] Blockchain secured. TXID:", txid);
  
  // 🛡️ MESH SYNC: Payload encapsulation
  // We wrap the variables into a single object to satisfy the 1-argument signature
  const payload = {
    pioneerId: pioneer.username,
    publicAddress: address,
    stakeAmount: STAKE_AMOUNT
  };

  const result = await registerSecurityCircle(payload);
  
  if (result.success) {
    alert("BOOTSTRAP LOCKED: 10 Test-Pi secured in Treasury.");
    router.refresh(); 
  } else {
    alert(result.error || "TRANSACTION FAILED.");
  }
  setIsSyncing(false);
},
        onCancel: () => {
          console.warn("[MESH-TX] Pioneer aborted.");
          setIsSyncing(false);
        },
        onError: (error: Error) => {
          console.error("[MESH-TX] Network Fracture:", error);
          alert("Transaction Failed. Check network connection.");
          setIsSyncing(false);
        }
      };

      pi.createPayment(paymentData, callbacks);

    } catch (error: any) {
      console.error(error);
      alert(error.message);
      setIsSyncing(false);
    }
  };

  // ... [Render States remain unchanged] ...
  
  if (!isHydrated || loadingDb) {
    return (
      <div className="bg-slate-950 p-6 min-h-screen flex flex-col justify-center items-center">
         <div className="text-emerald-500 font-mono animate-pulse">SCANNING MESH IDENTITY...</div>
      </div>
    );
  }

  if (nodeData) {
    return (
      <div className="bg-slate-950 p-6 min-h-screen flex flex-col justify-center max-w-lg mx-auto">
        <div className={`p-6 rounded-lg border ${nodeData.kyc_status === 'BOOTSTRAP_LOCKED' ? 'border-amber-500 bg-amber-950/20' : 'border-emerald-500 bg-emerald-950/20'}`}>
            <h2 className="text-white font-bold uppercase tracking-widest">{nodeData.kyc_status === 'BOOTSTRAP_LOCKED' ? "BOOTSTRAP ACTIVE" : "VALIDATOR ACTIVE"}</h2>
            <p className="text-slate-400 text-xs mt-3 font-mono">Identity: {nodeData.pioneerId}</p>
            <p className="text-slate-400 text-xs mt-1 font-mono">Address: {nodeData.publicAddress.substring(0, 12)}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 p-6 min-h-screen flex flex-col justify-center max-w-lg mx-auto">
      <h1 className="text-white font-mono text-xl uppercase tracking-widest mb-1">Validator Enrollment</h1>
      <form onSubmit={handleEnroll} className="flex flex-col gap-4">
        <input 
          placeholder="Paste G-Address..." 
          className="bg-slate-900 border border-slate-700 p-3 text-white rounded-lg grow focus:border-emerald-500 outline-none font-mono text-sm"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <button type="submit" className="bg-emerald-600 text-black font-bold p-3 rounded-lg uppercase tracking-widest hover:bg-emerald-500 transition-all">
          {isSyncing ? "VAULTING..." : "Submit Stake"}
        </button>
      </form>
    </div>
  );
}