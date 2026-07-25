"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 🛡️ MESH Interface Matrix: Fully mapped for all E-Network variations
interface PioneerAuthGateProps {
  children?: React.ReactNode;
  requiredTier?: string;
  onLinkEstablished?: (pioneerId: string) => void;
}

export default function PioneerAuthGate({ children, requiredTier, onLinkEstablished }: PioneerAuthGateProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // 🛡️ MESH Localhost Bypass Guard (Hard-coded to Master Founder Node)
    const isLocalhost = 
      typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (isLocalhost) {
      const masterNodeId = "pi_test_node_01";
      localStorage.setItem("mesh_pioneer_uid", masterNodeId);
      setIsAuthorized(true);
      if (onLinkEstablished) onLinkEstablished(masterNodeId);
      return;
    }

    // Production verification logic
    const session = localStorage.getItem("pioneer_session");
    const status = localStorage.getItem("MESH_PROVIDER_STATUS");
    const authData = localStorage.getItem("pi_auth_user");
    let pioneerId = "verified_pioneer";

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.uid) pioneerId = parsed.uid;
      } catch (e) {}
    }

    if (session === "ACTIVE" || status === "VERIFIED_ACTIVE") {
      setIsAuthorized(true);
      // Fire the identity link callback for staging/staking phases
      if (onLinkEstablished) onLinkEstablished(pioneerId);
    } else {
      console.warn("[SECURITY FRACTURE] Unidentified Node. Redirecting to Handshake.");
      router.push("/onboarding");
    }
  }, [router, requiredTier, onLinkEstablished]);

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-zinc-950 min-h-screen flex items-center justify-center font-mono text-xs text-amber-400">
        [SECURITY GATE] Verifying Node Credential Matrix...
      </div>
    );
  }

  // Safely render children if they exist, otherwise render nothing
  return <>{children}</>;
}