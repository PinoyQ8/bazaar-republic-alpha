"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { registerSecurityCircle, getSecurityCircleStatus } from "@/app/actions/defiActions";

export default function SecurityCircleGate() {
  // 🛡️ CAST HOOK CONTEXT TO BYPASS THE MISSING ISHYDRATED CONTRACT SIGNATURE
  const context = useAuth() as any;
  const pioneer = context.pioneer;
  const isHydrated = context.isHydrated as boolean;
  const router = useRouter();
  
  const [address, setAddress] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [nodeData, setNodeData] = useState<any>(null); 
  const [loadingDb, setLoadingDb] = useState(true);

  // 🛡️ MESH-BOOTSTRAP CONSTANTS
  const STAKE_AMOUNT = 10.00; 

  // 1. MESH-GUARD: Disarmed for Local Testing
  useEffect(() => {
    // Wait for the Simulator to wake up
    if (!isHydrated) return;

    // 🛡️ REMOVED THE router.push() ENTIRELY. 
    // It will no longer bounce you, even if auth takes a second.

    async function checkStatus() {
      // Only scan the database if we actually have a username
      if (pioneer.username) {
        const result = await getSecurityCircleStatus(pioneer.username);
        if (result.success) {
          setNodeData(result.data); // User already staked
        }
      }
      setLoadingDb(false);
    }
    
    checkStatus();
  }, [isHydrated, pioneer.username]); // Removed router dependencies

  // 2. MESH-TRANSACTION: The Pi SDK Payment Flow
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
          
          // 🚀 EXECUTE DATABASE VAULT WRITE AFTER CONFIRMATION
          const fd = new FormData();
          fd.append("pioneerId", pioneer.username);
          fd.append("publicAddress", address);
          fd.append("stakeAmount", STAKE_AMOUNT.toString());

          const result = await registerSecurityCircle(fd);
          
          if (result.success) {
            alert("BOOTSTRAP LOCKED: 10 Test-Pi secured in Treasury.");
            window.location.reload(); 
          } else {
            alert("Vault Fracture: " + result.message);
          }
          setIsSyncing(false);
        },
        onCancel: (paymentId: string) => {
          console.warn("[MESH-TX] Pioneer aborted the protocol.");
          setIsSyncing(false);
        },
        onError: (error: Error, payment: any) => {
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

  // 3. MESH-RENDER STATES

  // State A: Waiting for Hydration or DB check
  if (!isHydrated || loadingDb) {
    return (
      <div className="bg-slate-950 p-6 min-h-screen flex flex-col justify-center items-center">
         <div className="text-emerald-500 font-mono animate-pulse">SCANNING MESH IDENTITY...</div>
      </div>
    );
  }

  // State B: Node is already staked (Show Status Dashboard)
  if (nodeData) {
    return (
      <div className="bg-slate-950 p-6 min-h-screen flex flex-col justify-center max-w-lg mx-auto">
        <div className={`p-6 rounded-lg border ${nodeData.kyc_status === 'BOOTSTRAP_LOCKED' ? 'border-amber-500 bg-amber-950/20' : 'border-emerald-500 bg-emerald-950/20'}`}>
           <h2 className="text-white font-bold uppercase tracking-widest">{nodeData.kyc_status === 'BOOTSTRAP_LOCKED' ? "BOOTSTRAP ACTIVE" : "VALIDATOR ACTIVE"}</h2>
           <p className="text-slate-400 text-xs mt-3 font-mono">Identity: {nodeData.pioneerId}</p>
           <p className="text-slate-400 text-xs mt-1 font-mono">Address: {nodeData.publicAddress.substring(0, 12)}...</p>
           <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs">
              <span className="text-slate-500">Status Node</span>
              <span className={nodeData.kyc_status === 'BOOTSTRAP_LOCKED' ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>{nodeData.kyc_status}</span>
           </div>
        </div>
      </div>
    );
  }

  // State C: Enrollment Form (Not yet staked)
  return (
    <div className="bg-slate-950 p-6 min-h-screen flex flex-col justify-center max-w-lg mx-auto">
      <div className="border border-emerald-900 bg-emerald-950/20 p-4 mb-6 rounded-lg">
        <h2 className="text-emerald-400 font-bold uppercase text-sm">Genesis 100 Bootstrap</h2>
        <p className="text-emerald-500/70 text-xs">Requirement: 10 Test-Pi Stake | 24H Lock Period</p>
      </div>
      
      <h1 className="text-white font-mono text-xl uppercase tracking-widest mb-1">Validator Enrollment</h1>
      <p className="text-slate-500 text-xs font-mono mb-6">Identity: {pioneer.username}</p>
      
      <form onSubmit={handleEnroll} className="flex flex-col gap-4">
  <input type="hidden" name="pioneerId" value={pioneer.username} />

  {/* Added a stress-test helper */}
  <div className="flex gap-2">
  <input 
    placeholder="Paste G-Address..." 
    name="publicAddress" 
    className="bg-slate-900 border border-slate-700 p-3 text-white rounded-lg grow focus:border-emerald-500 outline-none font-mono text-sm"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
    required
  />
  <button 
    type="button" 
    onClick={() => setAddress("GDUMMY_TEST_WALLET_ADDRESS_77X")}
    className="bg-slate-800 text-emerald-500 px-3 rounded text-[10px] font-bold uppercase"
  >
    AUTO-FILL
  </button>
</div>
  
  <button type="submit" className="bg-emerald-600 text-black font-bold p-3 rounded-lg uppercase tracking-widest hover:bg-emerald-500 transition-all">
    {isSyncing ? "VAULTING..." : "Submit Stake"}
  </button>
</form>
    </div>
  );
}