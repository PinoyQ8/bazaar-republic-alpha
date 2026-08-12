"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// Declare window.Pi for TypeScript to prevent compiler panics
declare global {
  interface Window {
    Pi: any;
  }
}

function DeployFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const providerId = searchParams.get("providerId") || "UNKNOWN_NODE";
  const providerName = searchParams.get("name") || "Unknown Provider";
  const baseRate = searchParams.get("rate") || "0";

  const [taskScope, setTaskScope] = useState(
    "[PROTOCOL AGENT ATTESTATION: SIGN & BROADCAST AGREEMENT]\nDomain: Project Bazaar E-Network (Neo Protocol)\nTarget Contract: CCQ3HFJZJVKV3ZATDKNW32YCK7AZDTBVGBVRU5CXVN25OJR3KHVXU5DH\n\n1. Scope of Work:\n- Cryptographic transaction payload construction & XDR assembly.\n- Pre-flight RPC simulation & resource footprint validation (http://localhost:8000/soroban/rpc).\n- Zero-key-exposure client-side authorization via Pioneer Wallet / SDK.\n- On-chain transaction broadcast and block finality polling for MESH state settlement.\n\n2. Execution Parameters:\n- Settlement Asset: mBZR / Native Pi SAC\n- Security: Zero private key transmission over network boundary.\n- Settlement Target: Autonomous Escrow Lock & Time-Decay Reclaim."
  );
  const [estimatedHours, setEstimatedHours] = useState("12");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleExecuteBroadcast = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Calculate Escrow Allocation (Base Rate * Hours)
    // Fallback to 0.01 Pi minimum if testing with rate 0 to prevent SDK crash
    const rateVal = parseFloat(baseRate) || 0;
    const hoursVal = parseFloat(estimatedHours) || 0;
    const totalEscrow = Math.max(0.01, rateVal * hoursVal).toFixed(2);

    console.log("==================================================");
    console.log("[MESH-SCAN] INITIATING PI SDK PAYMENT PROTOCOL");
    console.log(`[MESH-SCAN] Target Node: ${providerId}`);
    console.log(`[MESH-SCAN] Escrow Lock Amount: ${totalEscrow} Pi`);
    console.log("==================================================");

    try {
      if (typeof window === "undefined" || !window.Pi) {
        throw new Error("[MESH-SCAN] Pi SDK not detected in global scope. Cannot broadcast.");
      }

      // Execute Native Pi Wallet Handshake
      window.Pi.createPayment({
        amount: parseFloat(totalEscrow),
        memo: `Escrow Lock: Node ${providerId.substring(0, 8)}`,
        metadata: {
          providerId: providerId,
          estimatedHours: estimatedHours,
          contractType: "BAZAAR_ESCROW_LOCK"
        },
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[MESH-SCAN] Server Approval Requested. Forwarding Payment ID:", paymentId);
          try {
            const res = await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });
            if (!res.ok) throw new Error("Approval Gate Rejected");
            console.log("✅ [MESH-SCAN] Server Approval Gate Passed.");
          } catch (error) {
            console.error("❌ [MESH-SCAN] API Approval Fault:", error);
            setIsSubmitting(false);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[MESH-SCAN] Blockchain Confirmed! Forwarding TXID to Server Gate:", txid);
          try {
            const res = await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });
            if (!res.ok) throw new Error("Completion Gate Rejected");
            
            console.log("✅ [MESH-SCAN] Contract Sealed on MESH.");
            alert(`✅ [MESH-SCAN] Escrow Locked! TXID: ${txid}`);
            setIsSubmitting(false);
            
            // Redirect Pioneer back to the Node profile upon success
            router.push(`/e-network/provider/${providerId}`);
          } catch (error) {
            console.error("❌ [MESH-SCAN] API Completion Fault:", error);
            setIsSubmitting(false);
          }
        },
        onCancel: (paymentId: string) => {
          console.warn("⚠️ [MESH-SCAN] Handshake Aborted by Pioneer. Payment ID:", paymentId);
          setIsSubmitting(false);
        },
        onError: (error: Error, payment: any) => {
          console.error("❌ [MESH-SCAN] Pi Wallet Broadcast Error:", error);
          setIsSubmitting(false);
        },
      });

    } catch (error) {
      console.error("[MESH-SCAN] System Fault:", error);
      alert("❌ [MESH-SCAN] SDK Fault: Pi Wallet could not be invoked.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-6">
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-emerald-400 font-mono tracking-wide">
          [ DEPLOY_SMART_CONTRACT ]
        </h1>
        <p className="text-zinc-400 text-xs mt-1">
          Establishing peer-to-peer escrow channel inside the E-Network.
        </p>
      </div>

      <div className="bg-zinc-900/40 p-4 border border-zinc-800 rounded-lg space-y-2 text-sm font-mono">
        <div className="flex justify-between">
          <span className="text-zinc-500">Target Node:</span>
          <span className="text-zinc-200 font-bold">{providerName.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Registry ID:</span>
          <span className="text-zinc-400 text-xs">{providerId}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-zinc-800/60">
          <span className="text-zinc-500">Locked Rate:</span>
          <span className="text-emerald-400 font-bold">{baseRate} Pi / hr</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
            Task Definition / Scope of Work
          </label>
          <textarea
            rows={8}
            value={taskScope}
            onChange={(e) => setTaskScope(e.target.value)}
            className="w-full bg-black text-zinc-100 border border-zinc-800 rounded p-3 text-xs focus:outline-none focus:border-emerald-500 font-mono resize-none leading-relaxed"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
            Escrow Allocation (Estimated Hours)
          </label>
          <input
            type="number"
            min={0.01}
            step="any"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            className="w-full bg-black text-zinc-100 border border-zinc-800 rounded p-3 text-sm focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div
            role="button"
            tabIndex={0}
            onClick={handleExecuteBroadcast}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleExecuteBroadcast(e);
              }
            }}
            className={`flex-1 text-center font-bold py-3 px-4 rounded font-mono text-sm uppercase select-none cursor-pointer ${
              isSubmitting
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-black"
            }`}
          >
            {isSubmitting ? "Broadcasting Envelope..." : "Sign & Broadcast Agreement"}
          </div>
          
          <Link
            href={`/e-network/provider/${providerId}`}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-center font-bold py-3 px-4 rounded font-mono text-sm uppercase flex items-center justify-center"
          >
            Abort Handshake
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ContractDeploymentSector() {
  return (
    <Suspense fallback={<div className="p-6 text-emerald-400 font-mono text-xs text-center">[ MESH_SCAN: Hydrating Sector... ]</div>}>
      <DeployFormContent />
    </Suspense>
  );
}