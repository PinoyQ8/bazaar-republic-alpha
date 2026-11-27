// Location: components/PasskeyEnrollmentCard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Fingerprint, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { safePiAuthenticate } from "@/app/utils/safePi";
import { getWebAuthnEnvironmentStatus } from "@/app/utils/webauthSupport";

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function PasskeyEnrollmentCard() {
  const { pioneer, login } = useAuth();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSigningInWithPi, setIsSigningInWithPi] = useState(false);
  const [enrolledId, setEnrolledId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [envStatus, setEnvStatus] = useState<{
    supported: boolean;
    isEmbeddedFrame: boolean;
    reason?: string;
  }>({ supported: true, isEmbeddedFrame: false });

  useEffect(() => {
    setEnvStatus(getWebAuthnEnvironmentStatus());
    if (typeof window !== "undefined") {
      const existing = window.localStorage.getItem("mesh_passkey_id");
      if (existing) setEnrolledId(existing);
    }
  }, []);

  const handlePiSignInFallback = async () => {
    setErrorMessage(null);
    setIsSigningInWithPi(true);
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
      } else {
        setErrorMessage("Pi Browser sign-in did not return a Pioneer UID.");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Pi Browser authentication failed."
      );
    } finally {
      setIsSigningInWithPi(false);
    }
  };

  const handleEnrollPasskey = async () => {
    setErrorMessage(null);

    const status = getWebAuthnEnvironmentStatus();
    setEnvStatus(status);

    if (!status.supported) {
      setErrorMessage(
        status.reason ||
          "Biometric passkey creation is unavailable here. Open your direct app URL in Pi Browser or sign in with Pi Browser."
      );
      return;
    }

    const activeUid =
      pioneer?.uid ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem("mesh_pioneer_uid")
        : null);

    if (!activeUid) {
      setErrorMessage("Authenticate with Pi Browser first before binding a passkey.");
      return;
    }

    setIsEnrolling(true);
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userIdBytes = new TextEncoder().encode(activeUid);
      const rpId = window.location.hostname;

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Bazaar Republic",
            id: rpId,
          },
          user: {
            id: userIdBytes,
            name: pioneer?.username || activeUid,
            displayName: pioneer?.username || `Pioneer (${activeUid.slice(0, 8)})`,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
          },
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("Passkey enrollment was cancelled.");
      }

      const credentialId = credential.id || toBase64Url(credential.rawId);
      const attestation = credential.response as AuthenticatorAttestationResponse;
      const rawPubKey =
        typeof attestation.getPublicKey === "function"
          ? attestation.getPublicKey()
          : null;
      const publicKey = rawPubKey
        ? toBase64Url(rawPubKey)
        : toBase64Url(attestation.attestationObject);
      const transports =
        typeof attestation.getTransports === "function"
          ? attestation.getTransports()
          : ["internal"];

      const res = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pioneer-uid": activeUid,
        },
        body: JSON.stringify({
          pioneerUid: activeUid,
          credentialId,
          publicKey,
          transports,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to register passkey on server.");
      }

      window.localStorage.setItem("mesh_passkey_id", credentialId);
      window.localStorage.setItem("mesh_pioneer_uid", activeUid);
      setEnrolledId(credentialId);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Passkey enrollment failed.";
      if (
        msg.includes("publickey-credentials-create") ||
        msg.toLowerCase().includes("permissions policy")
      ) {
        setErrorMessage(
          "This frame/sandbox blocks passkey creation. Open your direct app URL in Pi Browser to enroll biometrics, or continue with Pi Browser sign-in."
        );
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2.5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
          <Fingerprint className="h-3.5 w-3.5" />
          <span>Biometric Passkey</span>
        </div>
        {enrolledId && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Bound
          </span>
        )}
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Bind your device fingerprint or face passkey for fast passphraseless unlock.
      </p>

      {!envStatus.supported && envStatus.reason && (
        <div className="rounded-lg border border-amber-800/70 bg-amber-950/30 p-2 text-[10px] text-amber-200 flex items-start gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{envStatus.reason}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-rose-800/70 bg-rose-950/30 p-2 text-[10px] text-rose-200">
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={handleEnrollPasskey}
          disabled={isEnrolling || !envStatus.supported}
          className="w-full rounded-xl border border-emerald-700/80 bg-emerald-950/50 hover:bg-emerald-900/60 disabled:opacity-45 px-3 py-2 text-[11px] font-bold text-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isEnrolling ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Enrolling Passkey...</span>
            </>
          ) : (
            <>
              <Fingerprint className="h-3.5 w-3.5" />
              <span>
                {enrolledId ? "Re-Bind Device Passkey" : "Bind Biometric Passkey"}
              </span>
            </>
          )}
        </button>

        {(!envStatus.supported || !pioneer?.isAuthenticated) && (
          <button
            type="button"
            onClick={handlePiSignInFallback}
            disabled={isSigningInWithPi}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 px-3 py-2 text-[11px] font-bold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSigningInWithPi ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Signing In with Pi...</span>
              </>
            ) : (
              <span>Sign In with Pi Browser</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}