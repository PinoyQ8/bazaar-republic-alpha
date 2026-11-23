"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BazaarGate() {
  const [acceptedSecurity, setAcceptedSecurity] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const handlePiAuth = async () => {
    if (!acceptedSecurity || isAuthenticating) return;

    const Pi = typeof window !== "undefined" ? (window as any).Pi : null;
    if (!Pi || typeof Pi.authenticate !== "function") {
      setStatus("FRACTURE: Pi SDK Not Detected. Open in Pi Browser.");
      return;
    }

    setIsAuthenticating(true);
    setStatus("Initializing Pi SDK Handshake...");

    try {
      const isPiBrowser =
        typeof navigator !== "undefined" && /PiBrowser/i.test(navigator.userAgent);

      try {
        Pi.init({ version: "2.0", sandbox: !isPiBrowser });
      } catch {
        // Already initialized on this window lifecycle
      }

      const scopes = ["username", "payments", "wallet_address"];

      const onIncompletePaymentFound = async (payment: any) => {
        console.warn("[BAZAAR-GATE] Incomplete payment detected:", payment?.identifier);
        if (payment?.identifier && payment?.transaction?.txid) {
          await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: payment.identifier,
              txid: payment.transaction.txid,
              uid: payment?.user_uid,
            }),
          }).catch((err) => console.error("[BAZAAR-GATE] Recovery failed:", err));
        }
      };

      // 1. Await Pi SDK authentication result ({ accessToken, user })
      const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);
      if (!authResult?.accessToken) {
        throw new Error("Missing accessToken from Pi SDK.");
      }

      setStatus("Verifying Identity with Ledger...");

      // 2. Server-side token verification & sanction check
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: authResult.accessToken }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        setStatus("GATE_OPEN: Welcome, Pioneer.");
        router.push("/e-network/dashboard");
      } else {
        // Governance lock: catches FROZEN/sanctioned nodes or invalid tokens
        const reason = data.message || data.error || `HTTP ${response.status}`;
        setStatus(`GATE_CLOSED: ${reason}`);
      }
    } catch (err: any) {
      console.error("[BAZAAR-GATE] Auth Fracture:", err);
      setStatus(`FRACTURE: ${err?.message || "Pi Authentication Failed"}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-black border border-emerald-900 rounded-sm font-mono">
      {/* SECURITY MANIFEST */}
      <div className="mb-6 border-b border-emerald-900 pb-4">
        <h3 className="text-amber-500 font-bold uppercase tracking-widest text-[10px]">
          ðŸ›¡ï¸ BAZAAR MESH SECURITY NOTICE
        </h3>
        <ul className="mt-3 text-[9px] text-emerald-600 space-y-1">
          <li>1. ðŸŒ VERIFY URL: mesh-academy-alpha.vercel.app</li>
          <li>2. ðŸ”‘ KEY SOVEREIGNTY: We never request passphrases.</li>
          <li>3. ðŸ›‘ PROTOCOL ISOLATION: Avoid rogue nodes.</li>
        </ul>
        <div className="mt-4 flex items-center space-x-2 text-[10px] text-white">
          <input
            type="checkbox"
            checked={acceptedSecurity}
            onChange={() => setAcceptedSecurity(!acceptedSecurity)}
            className="accent-emerald-600"
          />
          <label>I UNDERSTAND THE MESH PROTOCOL</label>
        </div>
      </div>

      {/* AUTH TRIGGER */}
      <button
        onClick={handlePiAuth}
        disabled={!acceptedSecurity || isAuthenticating}
        className={`w-full py-3 text-[10px] uppercase tracking-wider font-bold transition-all ${
          acceptedSecurity && !isAuthenticating
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "bg-slate-900 text-slate-700 cursor-not-allowed"
        }`}
      >
        {status || "Validate Identity via Pi"}
      </button>
    </div>
  );
}
