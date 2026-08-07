// Location: app/components/PioneerAuthGate.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext"; // 🛡️ LINKED TO THE MASTER TS
import { safePiAuthenticate, type PiAuthResult } from "@/app/utils/safePi";

interface PioneerAuthGateProps {
  children: ReactNode;
  onLinkEstablished?: (pioneerId: string) => void;
}

export default function PioneerAuthGate({
  children,
  onLinkEstablished,
}: PioneerAuthGateProps) {
  const { pioneer, login } = useAuth(); // 🛡️ Read the Master Session
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);

  // 1. Ensure component is safely mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Main Authentication Execution
  useEffect(() => {
    if (!mounted) return;

    // 🛡️ THE MASTER TS BYPASS: If Context knows you, INSTANTLY unlock the gate.
    if (pioneer.isAuthenticated) {
      if (onLinkEstablished && pioneer.uid) {
        onLinkEstablished(pioneer.uid);
      }
      return; 
    }

    // --- If NOT authenticated in RAM, trigger the heavy Pi SDK ---
    let isMounted = true;
    setIsAuthenticating(true);

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
      console.warn("[MESH] ☢️ Nuclear Localhost Bypass Active. Gate Unlocked.");
      login({ // 🛡️ Push fake identity into Master TS
        uid: "PinoyQ8_Dev",
        username: "PinoyQ8_Dev",
        status: "ACTIVE",
        tier: "BAZAAR_FOUNDER"
      });
      if (onLinkEstablished) onLinkEstablished("X570_Bazaar_Founder");
      setIsAuthenticating(false);
      return;
    }

    // 🛡️ STANDARD PI SDK LOGIC (Executes only on Production/Vercel)
    const authTimeout = setTimeout(() => {
      if (isMounted && isAuthenticating) {
        setSdkFailed(true);
        setIsAuthenticating(false);
      }
    }, 3000);

    const runAuth = async () => {
      try {
        const authResult: PiAuthResult = await safePiAuthenticate(["username", "payments"]);
        
        if (isMounted && authResult?.user?.uid) {
          login({ // 🛡️ Push real identity into Master TS
            uid: authResult.user.uid,
            username: authResult.user.username,
            status: "ACTIVE",
          });
          if (onLinkEstablished) onLinkEstablished(authResult.user.uid);
        } else {
           if (isMounted) setSdkFailed(true);
        }
      } catch (error) {
        if (isMounted) setSdkFailed(true);
      } finally {
        if (isMounted) {
          clearTimeout(authTimeout);
          setIsAuthenticating(false);
        }
      }
    };

    runAuth();

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
    };
  }, [mounted, pioneer.isAuthenticated, login, onLinkEstablished]);

  // Render minimal fallback while waiting
  if (!mounted || isAuthenticating) {
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
  if (!pioneer.isAuthenticated && sdkFailed) {
    return (
      <div className="p-6 border border-red-800 bg-red-950/20 rounded-lg text-center space-y-4 m-4 shadow-[0_0_15px_rgba(185,28,28,0.2)]">
        <h3 className="text-red-500 text-lg font-bold">ACCESS DENIED: MESH GATEWAY LOCKED</h3>
        <p className="text-neutral-400 text-sm">
          Please open this application inside the Pi Browser node to authenticate your Pioneer credentials.
        </p>
      </div>
    );
  }

  // 🛡️ GATE OPEN: Node Verified
  return <>{children}</>;
}