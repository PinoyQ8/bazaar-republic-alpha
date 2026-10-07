"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function usePiAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const isPiBrowser =
      typeof navigator !== "undefined" &&
      (navigator.userAgent.includes("PiBrowser") || (window as any).Pi);

    // Timeout guard to break infinite rotating spinners
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Authentication handshake timed out (15s). Check Pi Network connectivity.")), 15000)
    );

    try {
      if (isPiBrowser && typeof window !== "undefined" && (window as any).Pi) {
        const Pi = (window as any).Pi;

        Pi.init({
          version: "2.0",
          sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === "true",
        });

        const authPromise = Pi.authenticate(
          ["username", "payments", "wallet_address"],
          async (incompletePayment: any) => {
            console.warn("[MESH] Incomplete payment caught:", incompletePayment);
            // Attempt auto-resolution or notify server to clear stalled payment
            try {
              await fetch("/api/payments/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "complete",
                  paymentId: incompletePayment.identifier,
                  txid: incompletePayment.transaction?.txid || "INCOMPLETE_CANCEL",
                }),
              });
            } catch (e) {
              console.error("Failed to clear incomplete payment", e);
            }
          }
        );

        const authResult: any = await Promise.race([authPromise, timeoutPromise]);

        // Exchange accessToken with backend
        const verifyRes = await fetch("/api/auth/pi-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: authResult.accessToken }),
        });

        const data = await verifyRes.json();
        if (!verifyRes.ok || !data.success) {
          throw new Error(data.error || "Backend verification rejected.");
        }

        // Commit Pioneer Session
        localStorage.setItem("mesh_pioneer_active", "true");
        localStorage.setItem("mesh_pioneer_id", data.pioneer?.username || authResult.user.username);
        localStorage.setItem("mesh_pioneer_uid", data.pioneer?.uid || authResult.user.uid);
        localStorage.setItem("mesh_pioneer_ts", Date.now().toString());

        router.refresh();
      } else {
        // Fallback for regular mobile Chrome over USB port forwarding
        console.warn("[MESH] Operating outside Pi Browser. Injecting sandbox session.");
        localStorage.setItem("mesh_pioneer_active", "true");
        localStorage.setItem("mesh_pioneer_id", "PinoyQ8_Dev");
        localStorage.setItem("mesh_pioneer_uid", "5f747bc9-1302-4135-a40d-af7880174f16");
        localStorage.setItem("mesh_pioneer_ts", Date.now().toString());
        router.refresh();
      }
    } catch (err: any) {
      console.error("[PI_AUTH_ERROR]:", err);
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { authenticate, loading, error };
}
