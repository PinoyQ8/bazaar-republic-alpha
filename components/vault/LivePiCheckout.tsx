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
    if (typeof window === "undefined") return;

    const initSDK = () => {
      const Pi = (window as any).Pi;
      if (!Pi) return false;
      try {
        const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
        Pi.init({ version: "2.0", sandbox: !isPiBrowser });
      } catch {
        // Ignore if already initialized on this window instance
      }
      return true;
    };

    if (!initSDK()) {
      const interval = setInterval(() => {
        if (initSDK()) clearInterval(interval);
      }, 150);
      return () => clearInterval(interval);
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
      setStatus("AUTHENTICATING");

      // Required callback: clears any stranded payment before starting a new one
      const onIncompletePaymentFound = async (payment: any) => {
        const paymentId = payment?.identifier;
        const txid = payment?.transaction?.txid;
        if (!paymentId || !txid) return;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "complete", paymentId, txid }),
            signal: controller.signal,
          });
        } catch (err) {
          console.warn("[PI_SDK] Incomplete payment recovery notice:", err);
        } finally {
          clearTimeout(timer);
        }
      };

      await Pi.authenticate(["username", "payments"], onIncompletePaymentFound);

      setStatus("CREATING_PAYMENT");

      Pi.createPayment(
        {
          amount: Number(amount),
          memo: String(memo),
          metadata: {
            orderId: `ESCROW_${Date.now()}`,
            type: "ESCROW_LOCK",
            network: "TESTNET",
          },
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
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(data?.error || "Approval rejected by server.");
              }
              setStatus("AWAITING_BIOMETRIC_SIGNATURE");
            } catch (err: any) {
              setErrorMsg(err?.message || "Approval network fault.");
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
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(data?.error || "Ledger completion failed.");
              }
              setTxDetails({ txid, paymentId });
              setStatus("SUCCESS");
              if (onSuccess) await onSuccess(paymentId, txid);
            } catch (err: any) {
              setErrorMsg(err?.message || "Completion network fault.");
              setStatus("ERROR");
            }
          },

          onCancel: () => {
            setStatus("READY");
          },

          onError: (error: Error) => {
            setErrorMsg(error?.message || "SDK transaction rejected.");
            setStatus("ERROR");
          },
        }
      );
    } catch (err: any) {
      setErrorMsg(err?.message || "Payment authentication or initialization failed.");
      setStatus("ERROR");
    }
  };

  const isPending = status !== "READY" && status !== "ERROR" && status !== "SUCCESS";

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4 font-mono text-xs">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isPending}
        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
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
            <span className="truncate">{status.replace(/_/g, " ")}...</span>
          </>
        )}
      </button>

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded text-rose-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-[11px] leading-tight break-all">{errorMsg}</span>
        </div>
      )}

      {txDetails && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded text-emerald-400 space-y-1 text-[10px]">
          <p className="font-bold">TX HASH: {txDetails.txid?.slice(0, 16)}...</p>
          <p className="text-slate-400">ID: {txDetails.paymentId?.slice(0, 16)}...</p>
        </div>
      )}
    </div>
  );
}