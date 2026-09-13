// components/MeshBridgeInitializer.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function MeshBridgeInitializer() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsMobile(/android|iphone|ipad|samsung/i.test(ua));
  }, []);

  const handleConnect = async () => {
    if (isMobile) {
      // Direct mobile nodes straight to Knox WebAuthn / MESH-101 flow
      router.push('/academy?module=mesh-101');
    } else {
      // Fallback for desktop browsers with extension support
      router.push('/auth/freighter-sync');
    }
  };

  return (
    <button
      onClick={handleConnect}
      className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 font-bold rounded-lg text-white transition-all shadow-lg"
    >
      {isMobile ? 'Authenticate Knox Passkey' : 'Sync Freighter Wallet'}
    </button>
  );
}