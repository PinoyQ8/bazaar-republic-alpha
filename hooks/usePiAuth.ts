'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function usePiAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        typeof event.data === 'string' &&
        (event.data.includes('webpack') || event.data.includes('next-') || event.data.includes('turbopack'))
      ) {
        return;
      }

      if (!event.data || typeof event.data !== 'object' || !event.data.piNetworkMessage) {
        return;
      }

      console.log('[PI_SDK_EVENT]:', event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const authenticate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const isPiBrowser = typeof navigator !== 'undefined' && /PiBrowser/i.test(navigator.userAgent);
    const clientId =
      process.env.NEXT_PUBLIC_PI_TESTNET_CLIENT_ID ||
      'FtbUB9fO3zfZZG3cp2SEpEdgzTNEgqpliDl8Q7Jr9Nc';

    try {
      if (isPiBrowser && typeof window !== 'undefined' && (window as any).Pi) {
        (window as any).Pi.init({
          version: '2.0',
          sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === 'true',
        });

        const authResult = await (window as any).Pi.authenticate(
          ['username', 'payments', 'wallet_address'],
          (incompletePayment: any) => {
            console.warn('[INCOMPLETE_PAYMENT_DETECTED]', incompletePayment);
          }
        );

        const verifyRes = await fetch('/api/auth/pi-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: authResult.accessToken }),
        });

        const data = await verifyRes.json();
        if (!verifyRes.ok || !data.success) {
          throw new Error(data.error || 'Server-side verification failed');
        }

        localStorage.setItem('mesh_pioneer_active', 'true');
        localStorage.setItem('mesh_pioneer_id', data.pioneer.username);
        localStorage.setItem('mesh_pioneer_uid', data.pioneer.uid);
        localStorage.setItem('mesh_pioneer_ts', Date.now().toString());

        router.push('/dashboard');
      } else {
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
