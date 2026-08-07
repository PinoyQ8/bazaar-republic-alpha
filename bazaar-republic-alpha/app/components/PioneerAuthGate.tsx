// Location: app/components/PioneerAuthGate.tsx
"use client";

import { useEffect, useState, ReactNode, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { safePiAuthenticate, type PiAuthResult } from "@/app/utils/safePi";
import { ShieldAlert, Fingerprint } from "lucide-react"; 
import PiAuthGate from "./PiAuthGate"; 

interface PioneerAuthGateProps {
  children: ReactNode;
  onLinkEstablished?: (pioneerId: string) => void;
}

export default function PioneerAuthGate({
  children,
  onLinkEstablished,
}: PioneerAuthGateProps) {
  const { pioneer, login } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);

  const authAttempted = useRef(false);

  // 1. Ensure component is safely mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Main Authentication Execution
  useEffect(() => {
    if (!mounted || authAttempted.current) return;

    // 🛡️ THE MASTER TS BYPASS: If Context knows you, unlock instantly.
    if (pioneer.isAuthenticated) {
      if (onLinkEstablished && pioneer.uid) {
        onLinkEstablished(pioneer.uid);
      }
      return; 
    }

    authAttempted.current = true;
    let isMounted = true;
    setIsAuthenticating(true);

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    /* 🛑 TEMPORARILY DISABLED FOR OAUTH TESTING
    if (isLocal) {
      console.warn("[MESH] ☢️ Nuclear Localhost Bypass Active. Gate Unlocked for X570.");
      login({ 
        uid: "PinoyQ8_Dev",
        username: "PinoyQ8_Dev",
        status: "ACTIVE",
        tier: "BAZAAR_FOUNDER"
      });
      if (onLinkEstablished) onLinkEstablished("X570_Bazaar_Founder");
      setIsAuthenticating(false);
      return;
    }
    */

    // 🛡️ STANDARD PI SDK LOGIC
    const authTimeout = setTimeout(() => {
      if (isMounted && isAuthenticating) {
        console.warn("[MESH] Pi SDK timeout. Pioneer is likely outside the Pi Browser Sandbox.");
        setSdkFailed(true);
        setIsAuthenticating(false);
      }
    }, 3000);

    const runAuth = async () => {
      try {
        const authResult: PiAuthResult = await safePiAuthenticate(["username"]);
        
        if (isMounted && authResult?.user?.uid) {
          login({ 
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, pioneer.isAuthenticated]); 

  // 🔴 RENDER: FALLBACK (Waiting state)
  if (!mounted || isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 font-mono">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-emerald-500 text-xs tracking-wider animate-pulse flex items-center gap-2">
          <Fingerprint className="w-4 h-4" /> FORGING MESH IDENTITY...
        </p>
      </div>
    );
  }

  // 🔴 RENDER: ACCESS DENIED + OAUTH BUTTON
  if (!pioneer.isAuthenticated && sdkFailed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 font-mono">
        <div className="p-6 border border-red-800 bg-red-950/20 rounded-lg text-center space-y-6 shadow-[0_0_15px_rgba(185,28,28,0.2)] max-w-md w-full">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
          <h3 className="text-red-500 text-sm font-bold uppercase tracking-widest">Mesh Gateway Locked</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Native Pi SDK injection failed. To access the Republic:
          </p>
          
          <div className="text-left bg-slate-900 p-4 rounded border border-slate-800 text-[11px] text-slate-300 space-y-2 mb-4">
            <p><strong>Option 1:</strong> Open this application inside the official <strong>Pi Browser</strong>.</p>
            <p><strong>Option 2:</strong> Use the Web Sign-In Gateway below.</p>
          </div>

          {/* 🛡️ THE OAUTH BUTTON IS NOW CORRECTLY MOUNTED OUTSIDE THE USE-EFFECT */}
          <div className="pt-4 border-t border-red-900/50">
             {/* ⚠️ IMPORTANT: Replace this placeholder with your real Client ID from the Pi Developer Portal */}
             <PiAuthGate clientId="YOUR_CLIENT_ID_HERE" /> 
          </div>
          
        </div>
      </div>
    );
  }

  // 🟢 RENDER: GATE OPEN (Node Verified)
  return <>{children}</>;
}