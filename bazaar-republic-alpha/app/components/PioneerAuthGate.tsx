"use client";

import { useEffect, useState, ReactNode } from "react";
import { safePiAuthenticate } from "@/app/utils/safePi";

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
    const runAuth = async () => {
      try {
        const authResult = await safePiAuthenticate(["username", "payments"]);
        
        if (authResult?.user?.uid) {
          setIsAuthenticated(true);
          if (onLinkEstablished) {
            onLinkEstablished(authResult.user.uid);
          }
        }
      } catch (error) {
        console.error("[MESH-ALERT] Authentication failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    runAuth();
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