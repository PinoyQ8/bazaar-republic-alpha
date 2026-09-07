'use client';
import { useEffect, useState } from 'react';

export default function DebugUID() {
  const [uid, setUid] = useState<string>('Authenticating...');

  useEffect(() => {
  if (typeof window === "undefined" || !window.Pi) return;
  const pi = window.Pi;

  pi.authenticate(["username"], (incompletePayment) => {
    console.warn("[DEBUG] Incomplete payment caught:", incompletePayment);
  })
    .then((authResult) => {
      console.log("[DEBUG] Pioneer UID:", authResult.user.uid);
    })
    .catch((error) => {
      console.error("[DEBUG] Authentication failed:", error);
    });
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
