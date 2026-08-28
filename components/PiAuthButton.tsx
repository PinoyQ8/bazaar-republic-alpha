// components/PiAuthButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function PiAuthButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handlePiSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!window.Pi) {
        throw new Error('Pi SDK not detected. Open inside Pi Browser.');
      }

      window.Pi.init({ version: '2.0', sandbox: true });

      const scopes = ['username', 'payments'];
      const onIncompletePaymentFound = (payment: any) => {
        console.warn('[MESH] Incomplete payment detected:', payment);
      };

      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);

      // Server verification handshake
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: authResult.accessToken,
          user: authResult.user,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server validation failed');
      }

      // Commit Pioneer session into MESH state
      login({
        username: data.user.username,
        uid: data.user.uid,
        accessToken: authResult.accessToken,
        status: 'ACTIVE',
        role: 'PIONEER',
      });

      router.push('/onboarding');
    } catch (err: any) {
      console.error('[MESH] Auth handshake failed:', err.message || err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <button
        onClick={handlePiSignIn}
        disabled={loading}
        className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wider uppercase rounded-md transition shadow-md disabled:opacity-50"
      >
        {loading ? 'Verifying with Pi Core...' : 'Sign In with Pi'}
      </button>
      {error && <p className="text-xs text-rose-500 font-mono text-center">{error}</p>}
    </div>
  );
}