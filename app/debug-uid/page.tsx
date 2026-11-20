'use client';
import { useEffect, useState } from 'react';

export default function DebugUID() {
  const [uid, setUid] = useState<string>('Authenticating...');

  useEffect(() => {
    const Pi = typeof window !== 'undefined' ? (window as any).Pi : null;
    if (!Pi) {
      setUid('Pi SDK not found. Open this in Pi Browser.');
      return;
    }

    const isPiBrowser =
      typeof navigator !== 'undefined' && /PiBrowser/i.test(navigator.userAgent);

    try {
      Pi.init({ version: '2.0', sandbox: !isPiBrowser });
    } catch {
      // Already initialized on this window lifecycle
    }

    const onIncompletePaymentFound = (payment: any) => {
      console.warn('[debug-uid] Incomplete payment detected:', payment?.identifier);
    };

    Pi.authenticate(['username', 'payments', 'wallet_address'], onIncompletePaymentFound)
      .then((auth: any) => {
        setUid(auth?.user?.uid || 'UID missing from Pi auth payload.');
      })
      .catch((err: any) => setUid('Error: ' + (err?.message || 'Auth failed')));
  }, []);

  return (
    <div className="p-10 font-mono text-green-500 bg-black h-screen">
      <h1>Project Bazaar: UID Harvester</h1>
      <p className="mt-5 text-2xl">Your App-Scoped UID:</p>
      <div className="mt-2 p-5 border border-green-500 text-white break-all">
        {uid}
      </div>
    </div>
  );
}