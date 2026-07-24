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

  useEffect(() => {
    let isMounted = true;

    const authTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("[MESH-ALERT] Auth response timed out. Releasing lock.");
        setLoading(false);
      }
    }, 8000);

    const runAuth = async () => {
      try {
        // 🛡️ Explicit type assignment resolves the line 33 build error
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
  }, [onLinkEstablished]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-amber-500 font-mono text-sm tracking-wider animate-pulse">
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