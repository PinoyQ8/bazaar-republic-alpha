"use client";

import { useEffect, useState } from "react";
import { pioneerClient } from '../lib/pioneer-client';
import { useAuth } from "@/context/AuthContext"; // 🛡️ Import True Identity

export default function TreasurySector() {
  const { pioneer, isHydrated } = useAuth(); // 🛡️ Anchor the user
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      // 🛡️ Await hydration shield
      if (!isHydrated) return;

      // 🛡️ Halt execution if the node isn't authenticated yet
      if (!pioneer?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 🛡️ REAL IDENTITY INJECTION: No more mock strings
        const result = await pioneerClient(pioneer.uid);
        setData(result);
      } catch (err) {
        console.error("[MESH-SCAN] Client fetch failed:", err);
        setError("Treasury sector unreachable.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isHydrated, pioneer?.uid]);

  // 🛡️ S23 Viewport Hard-Coded Styles
  if (loading) return (
    <main className="min-h-screen bg-black p-6 font-mono text-emerald-500">
      <h1 className="font-bold tracking-widest uppercase mb-4">Treasury Registry</h1>
      <p className="animate-pulse">Syncing MESH data...</p>
    </main>
  );

  if (error) return (
    <main className="min-h-screen bg-black p-6 font-mono text-red-500">
      <h1 className="font-bold tracking-widest uppercase mb-4">Treasury Registry</h1>
      <p>{error}</p>
    </main>
  );
  
  if (!pioneer?.uid) return (
    <main className="min-h-screen bg-black p-6 font-mono text-zinc-500">
      <h1 className="font-bold tracking-widest uppercase mb-4">Treasury Registry</h1>
      <p className="border border-zinc-800 p-4 bg-zinc-950">AWAITING PIONEER UPLINK...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-black p-4 font-mono flex flex-col items-center">
      <div className="w-full max-w-[384px] space-y-4 mt-4">
        <h1 className="text-xl text-emerald-400 font-bold tracking-widest uppercase border-b border-zinc-800 pb-2">
          Treasury Registry
        </h1>
        <pre className="bg-zinc-950 border border-emerald-900/30 p-4 rounded text-xs overflow-auto text-zinc-300 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </main>
  );
}