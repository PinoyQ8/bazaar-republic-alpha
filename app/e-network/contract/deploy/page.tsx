"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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

  // 🛡️ Auto-authenticate using standard Promise pattern
  useEffect(() => {
    const initAndAuthenticate = async () => {
      if (typeof window === "undefined" || !window.Pi) return;
      const cachedUser = localStorage.getItem("pi_auth_user");
      if (cachedUser) return;

      const pi = window.Pi;
      try {
        await pi.init({
          version: "2.0",
          sandbox: process.env.NODE_ENV !== "production",
        });

        console.log("[MESH-SCAN] Initializing authentication handshake...");
        const authResult = await pi.authenticate(
          ["username", "payments"],
          (incompletePayment: any) => {
            console.warn("[MESH-SCAN] Incomplete payment caught:", incompletePayment);
          }
        );

        console.log("[MESH-SCAN] Authentication Success:", authResult.user.username);
        localStorage.setItem(
          "pi_auth_user",
          JSON.stringify({
            uid: authResult.user.uid,
            username: authResult.user.username,
            accessToken: authResult.accessToken,
          })
        );
      } catch (error) {
        console.error("[MESH-SCAN] Pi Authentication Fault:", error);
      }
    };

    initAndAuthenticate();
  }, []);

  const handleExecuteBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (typeof window === "undefined" || !window.Pi) {
      alert("❌ [MESH-SCAN] Pi SDK not detected in active window. Open inside the Pi Browser.");
      return;
    }

    const pi = window.Pi;
    setIsSubmitting(true);

    let accessToken = "";
    try {
      const cached = localStorage.getItem("pi_auth_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        accessToken = parsed.accessToken || "";
      }
    } catch (err) {
      console.error("[MESH-SCAN] Failed to parse session token:", err);
    }

    const rateVal = parseFloat(baseRate) || 0;
    const hoursVal = parseFloat(estimatedHours) || 0;
    const totalEscrow = Math.max(0.01, rateVal * hoursVal).toFixed(2);

    try {
      pi.createPayment(
        {
          amount: parseFloat(totalEscrow),
          memo: `Escrow Lock: Node ${providerId.substring(0, 8)}`,
          metadata: {
            providerId,
            estimatedHours,
            contractType: "BAZAAR_ESCROW_LOCK",
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              const res = await fetch("/api/pi/approve", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
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
            try {
              const res = await fetch("/api/pi/complete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ paymentId, txid }),
              });
              if (!res.ok) throw new Error("Completion Gate Rejected");

              alert(`✅ [MESH-SCAN] Escrow Locked! TXID: ${txid}`);
              setIsSubmitting(false);
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
            console.error("❌ [MESH-SCAN] Pi Wallet Broadcast Error:", error, payment);
            setIsSubmitting(false);
          },
        }
      );
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

      <form onSubmit={handleExecuteBroadcast} className="space-y-4">
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
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 text-center font-bold py-3 px-4 rounded font-mono text-sm uppercase select-none transition-colors ${
              isSubmitting
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-black cursor-pointer"
            }`}
          >
            {isSubmitting ? "Broadcasting Envelope..." : "Sign & Broadcast Agreement"}
          </button>

          <Link
            href={`/e-network/provider/${providerId}`}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-center font-bold py-3 px-4 rounded font-mono text-sm uppercase flex items-center justify-center"
          >
            Abort Handshake
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ContractDeploymentSector() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-emerald-400 font-mono text-xs text-center">
          [ MESH_SCAN: Hydrating Sector... ]
        </div>
      }
    >
      <DeployFormContent />
    </Suspense>
  );
}