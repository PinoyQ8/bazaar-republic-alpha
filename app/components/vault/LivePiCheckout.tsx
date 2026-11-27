"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Coins, CheckCircle2, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  recoverIncompletePaymentOnServer,
  safePiAuthenticate,
} from "@/app/utils/safePi";

interface LivePiCheckoutProps {
  uid?: string;
  amount?: number;
  memo?: string;
  onSuccess?: (paymentId?: string, txid?: string) => void | Promise<void>;
}

export default function LivePiCheckout({
  amount = 1.0,
  memo = "Bazaar Republic Escrow Settlement Test",
  uid,
  onSuccess,
}: LivePiCheckoutProps) {
  const { pioneer } = useAuth() as any;
  const [status, setStatus] = useState<string>("READY");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txDetails, setTxDetails] = useState<{
    txid?: string;
    paymentId?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initSDK = () => {
      const w = window as any;
      if (!w.Pi) return false;
      if (!w.__PI_INITIALIZED__) {
        try {
          const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
          w.Pi.init({ version: "2.0", sandbox: !isPiBrowser });
          w.__PI_INITIALIZED__ = true;
        } catch {
          w.__PI_INITIALIZED__ = true;
        }
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

  const handleReset = () => {
    setStatus("READY");
    setErrorMsg(null);
    setTxDetails(null);
  };

  const handleCheckout = async () => {
    if (status !== "READY" && status !== "ERROR") return;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg("Payment amount must be greater than 0.");
      setStatus("ERROR");
      return;
    }

    const Pi = typeof window !== "undefined" ? (window as any).Pi : null;
    if (!Pi || typeof Pi.createPayment !== "function") {
      setErrorMsg("Pi SDK unavailable. Open inside Pi Browser.");
      setStatus("ERROR");
      return;
    }

    setErrorMsg(null);
    setStatus("AUTHENTICATING");

    try {
      const authResult = await Promise.race([
        safePiAuthenticate(
          ["username", "payments", "wallet_address"],
          async (incompletePayment) => {
            setStatus("RESOLVING_INCOMPLETE");
            await recoverIncompletePaymentOnServer(incompletePayment);
          }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Pi SDK auth timed out. Verify your app URL in Developer Portal and reload Pi Browser."
                )
              ),
            10000
          )
        ),
      ]);

      const resolvedUid = authResult?.user?.uid || uid || pioneer?.uid || "pioneer";
      setStatus("CREATING_PAYMENT");

      Pi.createPayment(
        {
          amount: numericAmount,
          memo: String(memo),
          metadata: {
            orderId: `LIVE_PI_${Date.now()}`,
            type: "ESCROW_LOCK",
            asset: "PI",
            currency: "PI",
            pioneer_uid: resolvedUid,
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            setStatus("SERVER_APPROVING");
            const res = await fetch("/api/payments/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
              setErrorMsg(data?.error || "Server approval failed.");
              setStatus("ERROR");
              return;
            }
            setStatus("AWAITING_PIONEER_SIGN");
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setStatus("SERVER_COMPLETING");
            const res = await fetch("/api/payments/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId,
                txid,
                pioneerUid: resolvedUid,
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
              setErrorMsg(data?.error || "Server completion failed.");
              setStatus("ERROR");
              return;
            }
            setTxDetails({ paymentId, txid });
            setStatus("SUCCESS");
            if (onSuccess) {
              await onSuccess(paymentId, txid);
            }
          },
          onCancel: () => {
            setStatus("READY");
          },
          onError: (err: any) => {
            setErrorMsg(err?.message || "Payment execution error.");
            setStatus("ERROR");
          },
        }
      );
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication or payment setup failed.");
      setStatus("ERROR");
    }
  };

  const isCompleted = status === "SUCCESS";
  const isBusy = status !== "READY" && status !== "ERROR" && status !== "SUCCESS";

  return (
    <div className="w-full max-w-[384px] mx-auto p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isBusy || isCompleted}
        className={`w-full py-3.5 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
          isCompleted
            ? "bg-emerald-500 text-slate-950 cursor-default"
            : "bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 cursor-pointer"
        }`}
      >
        {status === "READY" ? (
          <>
            <Coins className="w-4 h-4" />
            <span>Lock {amount} Pi via SDK</span>
          </>
        ) : status === "ERROR" ? (
          <>
            <RotateCcw className="w-4 h-4" />
            <span>Retry {amount} Pi Lock</span>
          </>
        ) : isCompleted ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
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
        <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded text-rose-400 text-[11px] leading-tight break-all">
          {errorMsg}
        </div>
      )}

      {txDetails && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded text-emerald-400 space-y-1 text-[10px]">
          <p className="font-bold">TX HASH: {txDetails.txid?.slice(0, 16)}...</p>
          <p className="text-slate-400">ID: {txDetails.paymentId?.slice(0, 16)}...</p>
          {isCompleted && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-1 inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Start New Payment</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}