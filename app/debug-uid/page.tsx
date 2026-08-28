'use client';
import { useEffect, useState } from 'react';

export default function DebugUID() {
  const [uid, setUid] = useState<string>('Authenticating...');

  useEffect(() => {
    // Standard Pi SDK Authentication Call
    if (typeof window !== 'undefined' && window.Pi) {
      window.Pi.init({ version: '2.0', sandbox: true });
      window.Pi.authenticate(['payments'], ['username']).then((auth: any) => {
        setUid(auth.user.uid);
      }).catch((err: any) => setUid('Error: ' + err.message));
    } else {
      setUid('Pi SDK not found. Open this in Pi Browser.');
    }
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
