// Location: app/hooks/usePasskeyAuth.ts
'use client';

import { useState } from 'react';

function bufferToBase64(buf: ArrayBuffer | null | undefined): string {
  if (!buf) return '';
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function usePasskeyAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerPasskey = async (pioneerUid: string) => {
    setLoading(true);
    setError(null);

    try {
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported on this device/browser environment.');
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Project Bazaar Republic',
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from(pioneerUid, (c) => c.charCodeAt(0)),
          name: pioneerUid,
          displayName: `Pioneer Node (${pioneerUid})`,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256 (Samsung Knox / WebAuthn)
          { alg: -257, type: 'public-key' }, // RS256 fallback
        ],
        authenticatorSelection: {
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'direct',
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Passkey creation was aborted by the user.');
      }

      const rawId = bufferToBase64(credential.rawId);
      const response = credential.response as AuthenticatorAttestationResponse;
      const pubKeyBase64 = bufferToBase64(
        typeof response.getPublicKey === 'function' ? response.getPublicKey() : null
      );

      const res = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerUid,
          credentialId: rawId,
          publicKey: pubKeyBase64,
          transports: typeof response.getTransports === 'function'
            ? response.getTransports()
            : ['internal'],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync passkey with node registry');
      }

      return data.credentialId || rawId;
    } catch (err: any) {
      const msg = err?.message || 'Passkey enrollment failed';
      setError(msg);
      console.error('[PASSKEY_REGISTER_ERROR]:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { registerPasskey, loading, error };
}