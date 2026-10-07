"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Coins, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";

interface LivePiCheckoutProps {
  amount?: number;
  memo?: string;
  onSuccess?: (paymentId?: string, txid?: string) => void | Promise<void>;
}

export default function LivePiCheckout({
  amount = 1.0,
  memo = "Bazaar Republic Escrow Settlement Test",
  onSuccess,
}: LivePiCheckoutProps) {
  const [status, setStatus] = useState<string>("READY");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txDetails, setTxDetails] = useState<{ txid?: string; paymentId?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initSDK = () => {
        const Pi = (window as any).Pi;
        if (Pi) {
          try {
            const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
            Pi.init({ version: "2.0", sandbox: !isPiBrowser });
            return true;
          } catch (err) {
            return true;
          }
        }
        return false;
      };

      if (!initSDK()) {
        const interval = setInterval(() => {
          if (initSDK()) clearInterval(interval);
        }, 150);
        return () => clearInterval(interval);
      }
    }
  }, []);

  const handleCheckout = async () => {
    setErrorMsg(null);
    setStatus("INITIALIZING");

    if (typeof window === "undefined" || !(window as any).Pi) {
      setErrorMsg("Pi SDK not detected. Open inside the official Pi Browser.");
      setStatus("ERROR");
      return;
    }

    const Pi = (window as any).Pi;

    try {
      // 🛡️ BAZAAR TECH: V5 DIRECT EXECUTION
      // The WebKit bridge is deadlocking on Pi.authenticate(). 
      // We skip it entirely and force the native Wallet sheet to open directly.
      setStatus("CREATING_PAYMENT");

      Pi.createPayment(
        {
          amount: Number(amount),
          memo: String(memo),
          metadata: { orderId: `ESCROW_${Date.now()}`, type: "ESCROW_LOCK", network: "TESTNET" },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            setStatus("SERVER_APPROVING");
            try {
              const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve", paymentId }),
              });
              if (!res.ok) throw new Error("Approval rejected by server.");
              setStatus("AWAITING_BIOMETRIC_SIGNATURE");
            } catch (err: any) {
              setErrorMsg(err.message || "Approval network fault. Is Atlas down?");
              setStatus("ERROR");
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setStatus("FINALIZING_LEDGER");
            try {
              const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "complete", paymentId, txid }),
              });
              if (!res.ok) throw new Error("Ledger completion failed.");
              setTxDetails({ txid, paymentId });
              setStatus("SUCCESS");
              if (onSuccess) await onSuccess(paymentId, txid);
            } catch (err: any) {
              setErrorMsg(err.message || "Completion network fault.");
              setStatus("ERROR");
            }
          },
          onCancel: () => setStatus("READY"),
          onError: (error: Error) => {
            setErrorMsg(error.message || "SDK transaction rejected.");
            setStatus("ERROR");
          },
        }
      );
    } catch (err: any) {
      setErrorMsg(err?.message || "Payment initialization failed.");
      setStatus("ERROR");
    }
  };

  const isPending = status !== "READY" && status !== "ERROR" && status !== "SUCCESS";

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4 font-mono text-xs">
      <button
        onClick={handleCheckout}
        disabled={isPending}
        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
      >
        {status === "READY" ? (
          <>
            <Coins className="w-4 h-4" />
            <span>⚡ Lock {amount} Test-Pi via SDK</span>
          </>
        ) : status === "ERROR" ? (
          <>
            <RotateCcw className="w-4 h-4" />
            <span>Retry {amount} Test-Pi Lock</span>
          </>
        ) : status === "SUCCESS" ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-950" />
            <span>Payment Succeeded</span>
          </>
        ) : (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span className="truncate">{status.replace(/_/g, " ")} (v5)...</span>
          </>
        )}
      </button>
      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded text-rose-400">
          <span className="text-[11px] leading-tight break-all">{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
