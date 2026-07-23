"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PioneerAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // 🛡️ MESH Localhost Bypass Guard
    const isLocalhost = 
      typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (isLocalhost) {
      setIsAuthorized(true);
      return;
    }

    // Production verification logic
    const session = localStorage.getItem("pioneer_session");
    const status = localStorage.getItem("MESH_PROVIDER_STATUS");

    if (session === "ACTIVE" || status === "VERIFIED_ACTIVE") {
      setIsAuthorized(true);
    } else {
      console.warn("[SECURITY FRACTURE] Unidentified Node. Redirecting to Handshake.");
      router.push("/onboarding");
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-zinc-950 min-h-screen flex items-center justify-center font-mono text-xs text-amber-400">
        [SECURITY GATE] Verifying Node Credential Matrix...
      </div>
    );
  }

  return <>{children}</>;
}