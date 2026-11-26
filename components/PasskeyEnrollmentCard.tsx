// Location: components/PasskeyEnrollmentCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Fingerprint, KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface PasskeyEnrollmentCardProps {
  onEnrolled?: (credentialId: string) => void;
}

export default function PasskeyEnrollmentCard({
  onEnrolled,
}: PasskeyEnrollmentCardProps) {
  const { pioneer } = useAuth();
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledKeyId, setEnrolledKeyId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem("mesh_passkey_id");
    if (existing) {
      setEnrolledKeyId(existing);
    }
  }, []);

  const handleEnrollPasskey = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!pioneer?.isAuthenticated || !pioneer?.uid) {
      setErrorMessage("Sign in with your Pioneer account before binding a passkey.");
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.credentials ||
      typeof navigator.credentials.create !== "function"
    ) {
      setErrorMessage(
        "WebAuthn passkey creation is not supported in this browser/WebView."
      );
      return;
    }

    setEnrolling(true);
    setStatusMessage("Prompting phone fingerprint / face unlock...");

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userIdBytes = new TextEncoder().encode(String(pioneer.uid));
      const rpId = window.location.hostname || "localhost";
      const displayName = pioneer.username || pioneer.uid;

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Bazaar Republic MESH",
            id: rpId,
          },
          user: {
            id: userIdBytes,
            name: String(pioneer.username || pioneer.uid),
            displayName: `Pioneer ${displayName}`,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            residentKey: "preferred",
          },
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!credential?.id) {
        throw new Error("No passkey credential ID returned by the device.");
      }

      window.localStorage.setItem("mesh_passkey_id", credential.id);
      setEnrolledKeyId(credential.id);
      setStatusMessage("Biometric passkey bound to this device.");
      onEnrolled?.(credential.id);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Passkey enrollment was cancelled or failed.";
      setErrorMessage(msg);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2.5 text-xs font-mono text-slate-100">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-bold text-emerald-300">
          <Fingerprint className="h-4 w-4 text-emerald-400" />
          <span>Device Biometric Passkey</span>
        </span>
        {enrolledKeyId ? (
          <span className="rounded border border-emerald-700/70 bg-emerald-950/70 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" /> BOUND
          </span>
        ) : (
          <span className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400">
            UNBOUND
          </span>
        )}
      </div>

      <p className="text-[10px] text-zinc-400 leading-relaxed">
        Bind your phone's fingerprint or face unlock for faster re-entry after signing in.
      </p>

      {enrolledKeyId && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[9px] text-zinc-400 truncate">
          Key ID: <span className="text-emerald-300">{enrolledKeyId}</span>
        </div>
      )}

      {statusMessage && (
        <div className="rounded-lg border border-emerald-800/70 bg-emerald-950/40 px-2.5 py-1.5 text-[10px] text-emerald-300">
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-rose-800/70 bg-rose-950/40 px-2.5 py-1.5 text-[10px] text-rose-300">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        disabled={enrolling || !pioneer?.isAuthenticated}
        onClick={handleEnrollPasskey}
        className="w-full rounded-xl border border-emerald-700/80 bg-emerald-950/50 hover:bg-emerald-900/60 disabled:opacity-45 disabled:cursor-not-allowed px-3 py-2 text-[11px] font-bold text-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        {enrolling ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Binding Biometrics...</span>
          </>
        ) : (
          <>
            <KeyRound className="h-3.5 w-3.5" />
            <span>{enrolledKeyId ? "Re-Bind Biometric Passkey" : "Bind Biometric Passkey"}</span>
          </>
        )}
      </button>
    </div>
  );
}