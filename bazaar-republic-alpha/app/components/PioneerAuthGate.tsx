"use client";

import { useEffect, useState, ReactNode } from "react";
import { safePiAuthenticate, type PiAuthResult } from "@/app/utils/safePi";

interface PioneerAuthGateProps {
  children: ReactNode;
  onLinkEstablished?: (pioneerId: string) => void;
}

export default function PioneerAuthGate({
  children,
  onLinkEstablished,
}: PioneerAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // 1. Ensure component is safely mounted on client before accessing DOM/Window
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Main Authentication Execution
  useEffect(() => {
    if (!mounted) return;

    let isMounted = true;

    // 🛡️ Synchronous query bypass check once mounted
    const searchParams = new URLSearchParams(window.location.search);
    const hasBypass = searchParams.get("bypass") === "true" || window.location.search.includes("FORCE_SYNC");

    if (hasBypass) {
      console.warn("[MESH] Force bypass query detected. Authorizing workspace.");
      setIsAuthenticated(true);
      setLoading(false);
      if (onLinkEstablished) onLinkEstablished("local_x570_node");
      return;
    }

    // 🛡️ 3-second maximum safeguard timer against SDK hanging
    const authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("[MESH-ALERT] Auth timeout reached. Releasing lock.");
        setLoading(false);
      }
    }, 3000);

    const runAuth = async () => {
      try {
        const authResult: PiAuthResult = await safePiAuthenticate(["username", "payments"]);
        
        if (isMounted && authResult?.user?.uid) {
          setIsAuthenticated(true);
          if (onLinkEstablished) {
            onLinkEstablished(authResult.user.uid);
          }
        }
      } catch (error) {
        console.error("[MESH-ALERT] Authentication failed:", error);
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) {
          clearTimeout(authTimeout);
          setLoading(false);
        }
      }
    };

    runAuth();

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
    };
  }, [mounted, onLinkEstablished]);

  // Render minimal fallback while waiting for initial React mounting
  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-amber-500 font-mono text-xs tracking-wider animate-pulse">
          AUTHENTICATING PIONEER IDENTITY...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 border border-red-800 bg-red-950/20 rounded-lg text-center space-y-4">
        <h3 className="text-red-500 text-lg font-bold">ACCESS DENIED: MESH GATEWAY LOCKED</h3>
        <p className="text-neutral-400 text-sm">
          Please open this application inside the Pi Browser node to authenticate your Pioneer credentials.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}