// Location: components/BiometricUnlockGate.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint, Loader2, ShieldAlert } from "lucide-react";
import { useAuth, type NodeStatus, type NodeTier } from "@/context/AuthContext";
import { safePiAuthenticate } from "@/app/utils/safePi";

export interface BiometricUnlockGateProps {
  children: React.ReactNode;
  onVerified?: (pioneerId: string) => void;
}

interface PasskeyVerifyResponse {
  success?: boolean;
  error?: string;
  code?: string;
  uid?: string;
  username?: string | null;
  tier?: string;
  status?: string;
  isFrozen?: boolean;
  isFounder?: boolean;
  trustScore?: number;
}

export default function BiometricUnlockGate({
  children,
  onVerified,
}: BiometricUnlockGateProps) {
  const { pioneer, login, isHydrated } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nodeFrozen, setNodeFrozen] = useState(false);

  const autoAttemptedRef = useRef(false);

  const verifyStoredPasskeyWithServer = useCallback(
    async (credentialId: string, cachedUid?: string) => {
      const res = await fetch("/api/auth/passkey/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cachedUid ? { "x-pioneer-uid": cachedUid } : {}),
        },
        body: JSON.stringify({
          credentialId,
          pioneerUid: cachedUid || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as PasskeyVerifyResponse;

      if (res.status === 403 && (data?.code === "NODE_FROZEN" || data?.isFrozen)) {
        setNodeFrozen(true);
        setErrorMessage(
          data?.error ||
            "Your Pioneer node is frozen or quarantined; biometric unlock is restricted."
        );
        return false;
      }

      if (!res.ok || !data?.success || !data?.uid) {
        setErrorMessage(data?.error || "Passkey verification failed on server.");
        return false;
      }

      const liveTier = (data.tier || "CITIZEN") as NodeTier;
      const liveStatus = (data.status || "ACTIVE") as NodeStatus;
      const liveIsFrozen = Boolean(data.isFrozen);

      login({
        uid: data.uid,
        username: data.username || pioneer.username || "Pioneer",
        tier: liveTier,
        status: liveStatus,
        role: data.isFounder ? "BAZAAR_FOUNDER" : liveTier,
        trustScore: typeof data.trustScore === "number" ? data.trustScore : 100,
        isAuthenticated: !liveIsFrozen,
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem("mesh_pioneer_uid", data.uid);
        if (data.username) {
          window.localStorage.setItem("mesh_pioneer_id", data.username);
        }
      }

      if (liveIsFrozen) {
        setNodeFrozen(true);
        setErrorMessage("Pioneer node is currently frozen.");
        return false;
      }

      setNodeFrozen(false);
      setErrorMessage(null);
      setStatusMessage(null);
      onVerified?.(data.uid);
      return true;
    },
    [login, onVerified, pioneer.username]
  );

  const unlockWithBiometrics = useCallback(async () => {
    setErrorMessage(null);
    setNodeFrozen(false);

    if (typeof window === "undefined") return false;

    const storedPasskeyId = window.localStorage.getItem("mesh_passkey_id");
    const cachedUserRaw = window.localStorage.getItem("pi_auth_user");
    let cachedUid =
      window.localStorage.getItem("mesh_pioneer_uid") || pioneer.uid || "";

    if (!cachedUid && cachedUserRaw) {
      try {
        const parsed = JSON.parse(cachedUserRaw);
        cachedUid = String(parsed?.uid || "").trim();
      } catch {
        // Ignore malformed cache
      }
    }

    if (!storedPasskeyId) {
      setRequiresSignIn(true);
      return false;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.credentials ||
      typeof navigator.credentials.get !== "function"
    ) {
      setErrorMessage("Biometric credentials are not available in this WebView.");
      setRequiresSignIn(true);
      return false;
    }

    setIsVerifying(true);
    setStatusMessage("Prompting device fingerprint / face unlock...");

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: "preferred",
          timeout: 20000,
        },
      })) as PublicKeyCredential | null;

      if (!assertion?.id) {
        setErrorMessage("Biometric verification did not return a credential.");
        setRequiresSignIn(true);
        return false;
      }

      // Prefer the credential returned by the authenticator (falling back to stored ID)
      const activeCredentialId = assertion.id || storedPasskeyId;
      window.localStorage.setItem("mesh_passkey_id", activeCredentialId);

      setStatusMessage("Verifying passkey & node standing...");
      const verified = await verifyStoredPasskeyWithServer(
        activeCredentialId,
        cachedUid || undefined
      );

      if (!verified) {
        setRequiresSignIn(true);
      }
      return verified;
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Biometric prompt was cancelled or timed out.";
      setErrorMessage(msg);
      setRequiresSignIn(true);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [pioneer.uid, verifyStoredPasskeyWithServer]);

  const signInWithPiBrowser = useCallback(async () => {
    setErrorMessage(null);
    setNodeFrozen(false);
    setIsVerifying(true);
    setStatusMessage("Authenticating with Pi Browser...");

    try {
      const authResult = await safePiAuthenticate(["username", "payments"]);
      if (authResult?.user?.uid) {
        login({
          uid: authResult.user.uid,
          username: authResult.user.username,
          status: "ACTIVE",
          tier: pioneer.tier || "CITIZEN",
          isAuthenticated: true,
        });
        setRequiresSignIn(false);
        onVerified?.(authResult.user.uid);
      } else {
        setErrorMessage("Pi Browser authentication did not return a user UID.");
        setRequiresSignIn(true);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Pi Browser sign-in failed."
      );
      setRequiresSignIn(true);
    } finally {
      setIsVerifying(false);
    }
  }, [login, onVerified, pioneer.tier]);

  useEffect(() => {
    if (!isHydrated || pioneer.isAuthenticated || autoAttemptedRef.current) {
      return;
    }
    autoAttemptedRef.current = true;

    (async () => {
      const hasPasskey =
        typeof window !== "undefined" &&
        Boolean(window.localStorage.getItem("mesh_passkey_id"));

      if (!hasPasskey) {
        setRequiresSignIn(true);
        return;
      }

      await unlockWithBiometrics();
    })();
  }, [isHydrated, pioneer.isAuthenticated, unlockWithBiometrics]);

  if (!isHydrated || isVerifying) {
    return (
      <div className="w-full max-w-[384px] mx-auto min-h-[50vh] flex flex-col items-center justify-center gap-3 font-mono text-emerald-400">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="text-xs tracking-wide">
          {statusMessage || "Checking biometric & node session..."}
        </p>
      </div>
    );
  }

  if (!pioneer.isAuthenticated && (requiresSignIn || nodeFrozen)) {
    return (
      <div className="w-full max-w-[384px] mx-auto p-4 font-mono text-slate-100">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 space-y-4 text-center shadow-xl">
          <ShieldAlert
            className={`h-7 w-7 mx-auto ${
              nodeFrozen ? "text-rose-400" : "text-amber-400"
            }`}
          />

          <div className="space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              {nodeFrozen ? "Pioneer Node Restricted" : "Biometric Unlock"}
            </h2>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {errorMessage ||
                "Unlock with your phone's fingerprint or face passkey, or sign in via Pi Browser."}
            </p>
          </div>

          {!nodeFrozen && (
            <button
              type="button"
              onClick={unlockWithBiometrics}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Fingerprint className="h-4 w-4" />
              <span>Unlock with Fingerprint / Face</span>
            </button>
          )}

          <button
            type="button"
            onClick={signInWithPiBrowser}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 py-2 px-3 text-[11px] font-bold cursor-pointer"
          >
            Sign In with Pi Browser
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}