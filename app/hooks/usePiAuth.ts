'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function usePiAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const piSdk = typeof window !== 'undefined' ? (window as any).Pi : undefined;
    const hasPiSdk = Boolean(piSdk);
    const isPiBrowser =
      typeof navigator !== 'undefined' &&
      (navigator.userAgent.includes('PiBrowser') || hasPiSdk);

    const clientId =
      process.env.NEXT_PUBLIC_PI_TESTNET_CLIENT_ID ||
      process.env.NEXT_PUBLIC_PI_CLIENT_ID ||
      'FtbUB9fO3zfZZG3cp2SEpEdgzTNEgqpliDl8Q7Jr9Nc';

    try {
      if (isPiBrowser && hasPiSdk) {
        // --- PATH A: Native Pi Browser JS SDK (S23 Ultra Node) ---
        try {
          piSdk.init({
            version: '2.0',
            sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true',
          });
        } catch (initErr) {
          console.warn('[PI_SDK_INIT_NOTE]', initErr);
        }

        const authResult = await piSdk.authenticate(
          ['username', 'payments', 'wallet_address'],
          (incompletePayment: any) => {
            console.warn('[INCOMPLETE_PAYMENT_FOUND]', incompletePayment);
          }
        );

        if (!authResult?.accessToken) {
          throw new Error('PI_AUTH_EMPTY_TOKEN: Failed to retrieve access token.');
        }

        // Forward token + verified client user payload
        const verifyRes = await fetch('/api/auth/pi-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authResult.accessToken}`,
          },
          body: JSON.stringify({
            accessToken: authResult.accessToken,
            uid: authResult.user?.uid,
            username: authResult.user?.username,
          }),
        });

        const data = await verifyRes.json();

        if (!verifyRes.ok || !data.success) {
          throw new Error(data.error || data.message || 'Server-side verification failed');
        }

        // 🛡️ COMMIT PIONEER STATE & TOKEN TO PERSISTENT MEMORY
        const pioneer = data.pioneer || data;
        const pioneerUsername = pioneer.username || authResult.user?.username || 'REAL_PIONEER';
        const pioneerUid = pioneer.uid || authResult.user?.uid || 'UNKNOWN_UID';

        localStorage.setItem('pi_access_token', authResult.accessToken);
        localStorage.setItem('mesh_session_active', 'true');
        localStorage.setItem('mesh_pioneer_id', pioneerUsername);
        localStorage.setItem('mesh_pioneer_uid', pioneerUid);
        localStorage.setItem('mesh_genesis_cleared', String(Boolean(pioneer.genesisCompleted)));
        localStorage.setItem('mesh_master_ts', Date.now().toString());

        router.push('/dashboard');
      } else {
        // --- PATH B: Standard Web Browser OAuth 2.0 Implicit Flow ---
        const state = crypto.randomUUID();
        sessionStorage.setItem('pi_oauth_state', state);

        const redirectUri = `${window.location.origin}/signin/callback`;
        const authUrl = new URL('https://accounts.pinet.com/oauth/authorize');
        authUrl.searchParams.set('response_type', 'token');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', 'username wallet_address');
        authUrl.searchParams.set('state', state);

        window.location.assign(authUrl.toString());
      }
    } catch (err: any) {
      console.error('[AUTH_ERROR]', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { authenticate, loading, error };
}