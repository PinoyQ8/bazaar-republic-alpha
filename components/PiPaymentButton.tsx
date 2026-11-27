"use client";

import React, { useEffect, useState } from "react";
import {
  recoverIncompletePaymentOnServer,
  safePiAuthenticate,
} from "@/app/utils/safePi";

interface PiPaymentButtonProps {
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
  escrowId?: string | null;
  onSuccess?: (paymentId: string, txid: string) => void | Promise<void>;
}

export default function PiPaymentButton({
  amount,
  memo,
  metadata = {},
  escrowId = null,
  onSuccess,
}: PiPaymentButtonProps) {
  const [status, setStatus] = useState<string>("INIT");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Pi = (window as any).Pi;
    if (Pi && typeof Pi.init === "function") {
      const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
      try {
        Pi.init({ version: "2.0", sandbox: !isPiBrowser });
      } catch {
        // Ignore if already initialized on this window
      }
    }
  }, []);

  const initiatePayment = async () => {
    if (
      status === "COMPLETED" ||
      [
        "AUTHENTICATING",
        "RESOLVING_OLD_PAYMENT",
        "CREATING_PAYMENT",
        "VERIFYING_WITH_SERVER",
        "AWAITING_WALLET_SIGN",
        "FINALIZING_PAYMENT",
      ].includes(status)
    ) {
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg("Payment amount must be a positive number.");
      setStatus("ERROR_DETECTED");
      return;
    }

    const Pi = typeof window !== "undefined" ? (window as any).Pi : null;
    if (!Pi || typeof Pi.createPayment !== "function") {
      setErrorMsg("Pi SDK unavailable. Open inside Pi Browser.");
      setStatus("ERROR_DETECTED");
      return;
    }

    setErrorMsg(null);
    setStatus("AUTHENTICATING");

    try {
      const auth = await safePiAuthenticate(
        ["username", "payments", "wallet_address"],
        async (incompletePayment) => {
          setStatus("RESOLVING_OLD_PAYMENT");
          await recoverIncompletePaymentOnServer(incompletePayment);
          setStatus("OLD_PAYMENT_CLEARED");
        }
      );

      setStatus("CREATING_PAYMENT");

      Pi.createPayment(
        {
          amount: numericAmount,
          memo: String(memo),
          metadata: {
            ...metadata,
            asset: "PI",
            currency: "PI",
            pioneer_uid: auth?.user?.uid || null,
            escrowId,
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            setStatus("VERIFYING_WITH_SERVER");
            const res = await fetch("/api/payments/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
              setErrorMsg(data?.error || "Server approval failed.");
              setStatus("HALT_FAILED");
              return;
            }
            setStatus("AWAITING_WALLET_SIGN");
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setStatus("FINALIZING_PAYMENT");
            const res = await fetch("/api/payments/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId,
                txid,
                escrowId,
                pioneerUid: auth?.user?.uid || null,
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
              setErrorMsg(data?.error || "Server completion failed.");
              setStatus("COMPLETION_FAILED");
              return;
            }
            setStatus("COMPLETED");
            if (onSuccess) {
              await onSuccess(paymentId, txid);
            }
          },
          onCancel: () => {
            setStatus("CANCELLED");
          },
          onError: (err: any) => {
            setErrorMsg(err?.message || "Payment SDK error.");
            setStatus("ERROR_DETECTED");
          },
        }
      );
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed.");
      setStatus("ERROR_DETECTED");
    }
  };

  const isDisabled =
    status === "COMPLETED" ||
    [
      "AUTHENTICATING",
      "RESOLVING_OLD_PAYMENT",
      "CREATING_PAYMENT",
      "VERIFYING_WITH_SERVER",
      "AWAITING_WALLET_SIGN",
      "FINALIZING_PAYMENT",
    ].includes(status);

  return (
    <div className="space-y-2 font-mono text-xs">
      <button
        type="button"
        onClick={initiatePayment}
        disabled={isDisabled}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-400 text-black font-bold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        {status === "INIT" ? `PAY ${amount} π` : status}
      </button>
      {errorMsg && (
        <p className="text-[11px] text-rose-400 break-all">{errorMsg}</p>
      )}
    </div>
  );
}