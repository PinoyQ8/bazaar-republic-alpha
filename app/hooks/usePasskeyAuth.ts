'use client';

import { useState } from 'react';

export function usePasskeyAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerPasskey = async (pioneerUid: string) => {
    setLoading(true);
    setError(null);

    try {
      // 🛡️ Verify WebAuthn support
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn is not supported on this device/browser environment.');
      }

      // Generate random challenge for registration
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Project Bazaar Republic',
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from(pioneerUid, c => c.charCodeAt(0)),
          name: pioneerUid,
          displayName: `Pioneer Node (${pioneerUid})`,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'falgs' } as any // RS256 fallback compatibility
        ],
        timeout: 60000,
        attestation: 'direct',
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Passkey creation was aborted by the user.');
      }

      // Encode credential details for storage
      const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const response = credential.response as AuthenticatorAttestationResponse;
      const pubKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey() || [])));

      // Sync with backend API route
      const res = await fetch('/api/auth/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pioneerUid,
          credentialId: rawId,
          publicKey: pubKeyBase64,
          transports: response.getTransports ? response.getTransports() : ['internal'],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync passkey with node registry');

      return data.credentialId;
    } catch (err: any) {
      setError(err.message || 'Passkey enrollment failed');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { registerPasskey, loading, error };
}