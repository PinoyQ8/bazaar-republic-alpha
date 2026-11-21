// Location: app/components/PioneerAuthGate.tsx
"use client";

import React, { useEffect, useState, ReactNode, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { safePiAuthenticate, type PiAuthResult } from "@/app/utils/safePi";
import { ShieldAlert, Fingerprint } from "lucide-react";
import PiAuthGate from "./PiAuthGate";

export interface PioneerAuthGateProps {
  children: ReactNode;
  clientId?: string;
  onLinkEstablished?: (pioneerId: string) => void;
}

const REQUIRED_PI_SCOPES = ["username", "payments", "wallet_address"];

export default function PioneerAuthGate({
  children,
  clientId,
  onLinkEstablished,
}: PioneerAuthGateProps) {
  const { pioneer, login } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);

  const authAttempted = useRef(false);

  const resolvedClientId =
    clientId ||
    (process.env.NEXT_PUBLIC_PI_SANDBOX === "true"
      ? process.env.NEXT_PUBLIC_PI_TESTNET_CLIENT_ID
      : process.env.NEXT_PUBLIC_PI_MAINNET_CLIENT_ID) ||
    process.env.NEXT_PUBLIC_PI_TESTNET_CLIENT_ID ||
    "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (pioneer.isAuthenticated) {
      if (onLinkEstablished && pioneer.uid) {
        onLinkEstablished(pioneer.uid);
      }
      setIsAuthenticating(false);
      return;
    }

    if (authAttempted.current) return;
    authAttempted.current = true;

    let isMounted = true;
    setIsAuthenticating(true);

    const authTimeout = setTimeout(() => {
      if (isMounted) {
        setSdkFailed(true);
        setIsAuthenticating(false);
      }
    }, 8000);

    const runAuth = async () => {
      try {
        const authResult: PiAuthResult =
          await safePiAuthenticate(REQUIRED_PI_SCOPES);

        if (isMounted && authResult?.user?.uid) {
          login({
            uid: authResult.user.uid,
            username: authResult.user.username,
            status: "ACTIVE",
          });
          if (onLinkEstablished) {
            onLinkEstablished(authResult.user.uid);
          }
        } else if (isMounted) {
          setSdkFailed(true);
        }
      } catch (error) {
        console.error("[MESH FAULT] SDK Handshake Terminated:", error);
        if (isMounted) {
          setSdkFailed(true);
        }
      } finally {
        clearTimeout(authTimeout);
        if (isMounted) {
          setIsAuthenticating(false);
        }
      }
    };

    runAuth();

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
    };
  }, [mounted, pioneer.isAuthenticated, pioneer.uid, login, onLinkEstablished]);

  if (!mounted || isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 font-mono">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-500 text-xs tracking-wider animate-pulse flex items-center gap-2">
          <Fingerprint className="w-4 h-4" /> FORGING MESH IDENTITY...
        </p>
      </div>
    );
  }

  if (!pioneer.isAuthenticated && sdkFailed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 font-mono">
        <div className="p-6 border border-red-800 bg-red-950/20 rounded-lg text-center space-y-6 shadow-[0_0_15px_rgba(185,28,28,0.2)] max-w-md w-full">
          <ShieldAlert className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
          <h3 className="text-red-500 text-sm font-bold uppercase tracking-widest">
            Mesh Gateway Locked
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Native Pi SDK injection failed or timed out. Open inside Pi Browser or use Web Sign-In below.
          </p>

          <div className="pt-4 border-t border-red-900/50">
            <PiAuthGate clientId={resolvedClientId} />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}