// Location: app/components/PioneerAuthGate.tsx
"use client";

import { useEffect, useState, ReactNode, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authAttempted.current) return;

    if (pioneer.isAuthenticated) {
      if (onLinkEstablished && pioneer.uid) {
        onLinkEstablished(pioneer.uid);
      }
      return; 
    }

    authAttempted.current = true;
    let isMounted = true;
    setIsAuthenticating(true);

    const runAuth = async () => {
      try {
        // 🛡️ DELEGATION PROTOCOL: No timer here. safePi.ts handles the 60s timeout.
        const authResult: PiAuthResult = await safePiAuthenticate(["username", "payments"]);
        
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
        console.error("[MESH FAULT] SDK Handshake Terminated:", error);
        if (isMounted) setSdkFailed(true);
      } finally {
        if (isMounted) {
          setIsAuthenticating(false);
        }
      }
    };

    runAuth();

    return () => {
      isMounted = false;
    };
  }, [mounted, pioneer.isAuthenticated, login, onLinkEstablished]); 

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

  // Replace the warning box block (lines 62-75) with this:
  if (!pioneer.isAuthenticated && sdkFailed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 font-mono">
        <div className="p-6 border border-red-800 bg-red-950/20 rounded-lg text-center space-y-6 shadow-[0_0_15px_rgba(185,28,28,0.2)] max-w-md w-full">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
          <h3 className="text-red-500 text-sm font-bold uppercase tracking-widest">Mesh Gateway Restricted</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Native Pi SDK injection failed. To access the Republic:
          </p>
          
          <div className="text-left bg-slate-900 p-4 rounded border border-slate-800 text-[11px] text-slate-300 space-y-2 mb-4">
            <p className="text-emerald-400"><strong>Option 1 (Full Access):</strong> Open inside the official <strong>Pi Browser</strong>. Required for all marketplace transactions.</p>
            <p className="text-amber-400"><strong>Option 2 (Read-Only):</strong> Use the Web Sign-In below. You can view data, but financial contracts are locked.</p>
          </div>

          <div className="pt-4 border-t border-red-900/50">
             {/* 🛡️ INJECTED REAL PORTAL CLIENT ID TO UNLOCK WEB OAUTH */}
             <PiAuthGate clientId="FtbUB9fO3zfZZG3cp2SEpEdgzTNEgqpliDl8Q7Jr9Nc" /> 
          </div>
          
        </div>
      </div>
    );
  }

  return <>{children}</>;
}