"use client";

import { useState, useEffect } from "react";

export default function PiConnect() {
  const [isPiBrowser, setIsPiBrowser] = useState(false);

  useEffect(() => {
    // 🛡️ BAZAAR TECH: Detect injected Pi SDK
    if (typeof window !== "undefined" && (window as any).Pi) {
      setIsPiBrowser(true);
    }
  }, []);

  const authenticate = async () => {
    try {
      const scopes = ['username', 'uid'];
      const Pi = (window as any).Pi;

      // 🛡️ AUTH HANDSHAKE
      const auth = await Pi.authenticate(scopes, 
        (authResult: any) => {
          console.log("[MESH-AUTH] Payload Captured:", authResult);
          // Send authResult.accessToken to your API for server-side verification
        },
        (error: any) => {
          console.error("[MESH-AUTH] Fracture:", error);
        }
      );
    } catch (err) {
      console.error("[MESH-AUTH] SDK Error:", err);
    }
  };

  if (!isPiBrowser) return <p className="text-[10px] text-red-500">Access Bazaar via Pi Browser to Register.</p>;

  return (
    <button onClick={authenticate} className="bg-emerald-600 px-4 py-2 rounded text-white font-mono text-xs uppercase">
      Validate Identity via Pi
    </button>
  );
}