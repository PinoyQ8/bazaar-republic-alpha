// Location: app/components/PioneerAuthGate.tsx
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

  // 1. Ensure component is safely mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Main Authentication Execution
  useEffect(() => {
    if (!mounted) return;

    let isMounted = true;

    // 🛡️ THE NUCLEAR X570 BYPASS
    // Instantly unlock the gate if developing on localhost
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
      console.warn("[MESH] ☢️ Nuclear Localhost Bypass Active. Gate Unlocked.");
      setIsAuthenticated(true);
      setLoading(false);
      
      // Auto-inject a dummy identity for the Academy actions to use
      if (onLinkEstablished) onLinkEstablished("X570_Bazaar_Founder");
      
      // Seed local storage so other components don't starve
      if (!localStorage.getItem("pi_auth_user")) {
        localStorage.setItem("pi_auth_user", JSON.stringify({
          uid: "PinoyQ8_Dev",
          username: "PinoyQ8_Dev",
          status: "ACTIVE",
          tier: "Founder"
        }));
      }
      return;
    }

    // 🛡️ STANDARD PI SDK LOGIC (Executes only on Production/Vercel)
    const authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 3000);

    const runAuth = async () => {
      try {
        const authResult: PiAuthResult = await safePiAuthenticate(["username", "payments"]);
        
        if (isMounted && authResult?.user?.uid) {
          setIsAuthenticated(true);
          if (onLinkEstablished) onLinkEstablished(authResult.user.uid);
        }
      } catch (error) {
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

  // Render minimal fallback while waiting
  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-mono text-xs tracking-wider animate-pulse">
          FORGING MESH IDENTITY...
        </p>
      </div>
    );
  }

  // Render Access Denied for actual Production if SDK fails
  if (!isAuthenticated) {
    return (
      <div className="p-6 border border-red-800 bg-red-950/20 rounded-lg text-center space-y-4 m-4 shadow-[0_0_15px_rgba(185,28,28,0.2)]">
        <h3 className="text-red-500 text-lg font-bold">ACCESS DENIED: MESH GATEWAY LOCKED</h3>
        <p className="text-neutral-400 text-sm">
          Please open this application inside the Pi Browser node to authenticate your Pioneer credentials.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}