"use client";

import { useMeshStatus } from "@/app/components/MeshInitializer";

export default function TreasuryRegistry() {
  const { accessToken, isPiReady } = useMeshStatus();

  const fetchTreasuryData = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch("/api/treasury/registry", {
        method: "GET",
        headers: {
          // 🛡️ BAZAAR TECH: Injecting the Token to satisfy the API check
          "Authorization": `Bearer ${accessToken}`, 
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Unauthorized");
      // ... handle success
    } catch (error) {
      console.error("[MESH-SCAN] Treasury Access Denied:", error);
    }
  };

  // ... rest of component
}