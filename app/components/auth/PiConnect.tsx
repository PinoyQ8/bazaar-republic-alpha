"use client";

import { useState, useEffect } from "react";

interface VerifiedUser {
  uid: string;
  username: string;
}

export default function PiConnect() {
  const [hasPiSdk, setHasPiSdk] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Pi) {
      setHasPiSdk(true);
    }
  }, []);

  const authenticate = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const Pi = (window as any).Pi;
      if (!Pi) {
        throw new Error("Pi SDK unavailable. Open inside Pi Browser.");
      }

      const isPiBrowserUa =
        typeof navigator !== "undefined" && /PiBrowser/i.test(navigator.userAgent);

      try {
        Pi.init({ version: "2.0", sandbox: !isPiBrowserUa });
      } catch {
        // Already initialized on this window lifecycle
      }

      const scopes = ["username", "payments", "wallet_address"];

      const onIncompletePaymentFound = async (payment: any) => {
        console.warn("[MESH-AUTH] Incomplete payment detected:", payment?.identifier);
        if (payment?.identifier && payment?.transaction?.txid) {
          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: payment.identifier,
              txid: payment.transaction.txid,
              uid: payment?.user_uid,
            }),
          }).catch((err) => console.error("[MESH-AUTH] Payment recovery failed:", err));
        }
      };

      // Returns { accessToken, user: { uid, username, wallet_address? } }
      const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
      if (!auth?.accessToken || !auth?.user?.uid) {
        throw new Error("Incomplete authentication payload from Pi SDK.");
      }

      // Server-side verification against Pi Core /v2/me
      const verifyRes = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          user: {
            uid: auth.user.uid,
            username: auth.user.username,
          },
        }),
      });

      const data = await verifyRes.json();
      if (!verifyRes.ok || !data?.verified) {
        throw new Error(data?.error || "Server-side identity verification failed.");
      }

      setVerifiedUser(data.user);
      console.log("[MESH-AUTH] Verified Pioneer:", data.user.username);
    } catch (err: any) {
      console.error("[MESH-AUTH] SDK Error:", err);
      setErrorMsg(err?.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPiSdk) {
    return (
      <p className="text-[10px] text-red-500 font-mono">
        Access Bazaar via Pi Browser to Register.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={authenticate}
        disabled={isLoading}
        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 rounded text-white font-mono text-xs uppercase"
      >
        {isLoading
          ? "Validating Identity..."
          : verifiedUser
          ? `Verified: @${verifiedUser.username}`
          : "Validate Identity via Pi"}
      </button>
      {errorMsg && (
        <p className="text-[10px] text-red-400 font-mono">{errorMsg}</p>
      )}
    </div>
  );
}
