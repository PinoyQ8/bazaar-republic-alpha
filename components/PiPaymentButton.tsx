"use client";

import React, { useState, useEffect } from "react";

interface PiPaymentButtonProps {
  amount: number;
  memo: string;
  metadata?: Record<string, any>;
  onSuccess?: (paymentId: string, txid: string) => void | Promise<void>;
}

export default function PiPaymentButton({
  amount,
  memo,
  metadata = {},
  onSuccess,
}: PiPaymentButtonProps) {
  const [status, setStatus] = useState<string>("INIT");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const displayAmount = Number.isFinite(numericAmount) ? numericAmount : 0;

  useEffect(() => {
    try {
      const Pi = typeof window !== "undefined" ? (window as any).Pi : null;
      if (Pi && typeof Pi.init === "function") {
        const isPiBrowser =
          typeof navigator !== "undefined" && /PiBrowser/i.test(navigator.userAgent);
        Pi.init({
          version: "2.0",
          sandbox: !isPiBrowser,
        });
      }
    } catch (err) {
      console.error("[MESH-SCAN] Pi SDK Init Fracture:", err);
    }
  }, []);

  const initiatePayment = async () => {
    setErrorMsg(null);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg("Payment amount must be a positive PI value.");
      setStatus("ERROR_DETECTED");
      return;
    }

    const Pi = typeof window !== "undefined" ? (window as any).Pi : null;
    if (!Pi || typeof Pi.authenticate !== "function" || typeof Pi.createPayment !== "function") {
      setErrorMsg("Pi SDK unavailable. Open inside Pi Browser.");
      setStatus("FRACTURE_DETECTED");
      return;
    }

    try {
      const isPiBrowser =
        typeof navigator !== "undefined" && /PiBrowser/i.test(navigator.userAgent);
      try {
        Pi.init({ version: "2.0", sandbox: !isPiBrowser });
      } catch {
        // Ignore if already initialized on this window
      }

      setStatus("AUTHENTICATING");
      const scopes = ["payments", "username"];

      const onIncompletePaymentFound = async (payment: any) => {
        console.warn("[MESH-SCAN] Incomplete Payment Detected:", payment?.identifier);
        setStatus("RESOLVING_OLD_PAYMENT");

        if (payment?.identifier && payment?.transaction?.txid) {
          const res = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "complete",
              paymentId: payment.identifier,
              txid: payment.transaction.txid,
            }),
          });
          if (res.ok) {
            setStatus("OLD_PAYMENT_CLEARED");
          }
        }
      };

      const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
      console.log(`[MESH-SCAN] Pioneer Authenticated: ${auth?.user?.username || "unknown"}`);

      Pi.createPayment(
        {
          amount: numericAmount,
          memo: String(memo),
          metadata: {
            ...metadata,
            asset: "PI",
            currency: "PI",
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            setStatus("VERIFYING_WITH_ADJUDICATOR");

            const res = await fetch("/api/payments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "approve", paymentId }),
            });

            if (res.ok) {
              setStatus("TRANSACTION_SECURED");
            } else {
              const errData = await res.json().catch(() => ({}));
              setErrorMsg(errData?.error || "Server approval failed.");
              setStatus("HALT_FAILED");
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            setStatus("FINALIZING_LEDGER");

            const res = await fetch("/api/payments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "complete", paymentId, txid }),
            });

            if (res.ok) {
              setStatus("COMPLETED");
              if (onSuccess) await onSuccess(paymentId, txid);
            } else {
              const errData = await res.json().catch(() => ({}));
              setErrorMsg(errData?.error || "Server completion failed.");
              setStatus("COMPLETION_FAILED");
            }
          },

          onCancel: () => {
            setStatus("CANCELLED");
          },

          onError: (err: any) => {
            console.error("[MESH-SCAN] SDK Error:", err);
            setErrorMsg(err?.message || "Pi SDK payment error.");
            setStatus("ERROR_DETECTED");
          },
        }
      );
    } catch (err: any) {
      console.error("[MESH-SCAN] Authentication Fracture:", err);
      setErrorMsg(err?.message || "Authentication or payment initiation failed.");
      setStatus("FRACTURE_DETECTED");
    }
  };

  const isDisabled = [
    "AUTHENTICATING",
    "RESOLVING_OLD_PAYMENT",
    "VERIFYING_WITH_ADJUDICATOR",
    "FINALIZING_LEDGER",
    "COMPLETED",
  ].includes(status);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={initiatePayment}
        disabled={isDisabled}
        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-bold rounded-lg transition-all"
      >
        {status === "INIT" ? `PAY ${displayAmount} π` : status}
      </button>
      {errorMsg && (
        <p className="text-xs font-mono text-rose-400 break-all">{errorMsg}</p>
      )}
    </div>
  );
}