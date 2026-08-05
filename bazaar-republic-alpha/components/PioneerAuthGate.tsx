"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 🛡️ MESH Interface Matrix
interface PioneerAuthGateProps {
  children?: React.ReactNode;
  requiredTier?: string;
  onLinkEstablished?: (pioneerId: string) => void;
}

export default function PioneerAuthGate({ children, requiredTier, onLinkEstablished }: PioneerAuthGateProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true); // 🛡️ Added Buffer State

  useEffect(() => {
    // 🛡️ MESH Localhost Bypass Guard
    const isLocalhost = 
      typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (isLocalhost) {
      const masterNodeId = "pi_test_node_01";
      localStorage.setItem("mesh_pioneer_uid", masterNodeId);
      setIsAuthorized(true);
      setIsScanning(false);
      if (onLinkEstablished) onLinkEstablished(masterNodeId);
      return;
    }

   // 🛡️ The Buffer Shield: Wait 800ms for Pi Browser storage resolution
    const scanTimer = setTimeout(() => {
      // Pull all possible Neo-Sync and SDK storage keys
      const authData = localStorage.getItem("pi_auth_user");
      const neoActive = localStorage.getItem("mesh_pioneer_active");
      
      let pioneerId = "verified_pioneer";
      let isPiAuthValid = false;

      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.uid) pioneerId = parsed.uid;
          if (parsed.isAuthenticated) isPiAuthValid = true; // 🛡️ Anchor check
        } catch (e) {}
      }

      // 🛡️ ADJUDICATION: Now checks for the actual AuthContext output
      if (isPiAuthValid || neoActive === "true") {
        setIsAuthorized(true);
        if (onLinkEstablished) onLinkEstablished(pioneerId);
      } else {
        console.warn("[SECURITY FRACTURE] Unidentified Node. Redirecting to Handshake.");
        router.push("/onboarding");
      }
      
      setIsScanning(false); // Drop the loading shield
    }, 800);

    // Cleanup timer to prevent memory leaks if node disconnects early
    return () => clearTimeout(scanTimer);
  }, [router, requiredTier, onLinkEstablished]);

  // Render the scanning UI while the buffer holds
  if (isScanning || !isAuthorized) {
    return (
      <div className="p-6 bg-zinc-950 min-h-screen flex flex-col items-center justify-center font-mono text-xs text-amber-400">
        <div className="mb-4 text-lg">🛡️</div>
        <div>[SECURITY GATE] Verifying Node Credential Matrix...</div>
      </div>
    );
  }

  return <>{children}</>;
}