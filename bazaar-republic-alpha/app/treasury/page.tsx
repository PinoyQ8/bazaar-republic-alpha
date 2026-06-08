"use client"; // Shifted to Client Component for runtime-safe data fetching

import { useEffect, useState } from "react";
import { pioneerClient } from '../lib/pioneer-client';

export default function TreasurySector() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // This only executes in the browser, bypassing the build-time fetch deadlock
        const result = await pioneerClient('LOCAL_DEV_PIONEER_01');
        setData(result);
      } catch (err) {
        console.error("[MESH-SCAN] Client fetch failed:", err);
        setError("Treasury sector unreachable.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <main><h1>Treasury Registry</h1><p>Syncing MESH data...</p></main>;
  if (error) return <main><h1>Treasury Registry</h1><p className="text-red-500">{error}</p></main>;

  return (
    <main>
      <h1>Treasury Registry</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}