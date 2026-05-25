'use client';

import { useState, useEffect } from 'react';

export default function TreasuryViewport() {
  const [vaultStatus, setVaultStatus] = useState("UNBOUND");
  const [totalBurned, setTotalBurned] = useState(0);

  // 🛡️ MESH-SCAN: Read Telemetry on Load
  useEffect(() => {
    async function syncLedger() {
      try {
        const res = await fetch('/api/treasury');
        if (res.ok) {
          const data = await res.json();
          setTotalBurned(data.totalBurned || 0);
        }
      } catch (error) {
        console.error("TELEMETRY_FRACTURE:", error);
      }
    }
    syncLedger();
  }, []);

  // 🛡️ THE GATEWAY: Execute Genesis Bind
  const handleGenesisBind = async () => {
    try {
      const res = await fetch('/api/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'INITIALIZE_GENESIS_BIND' })
      });
      
      const data = await res.json();
      if (data.status === "SECURE") {
        setVaultStatus(data.vaultState);
      }
    } catch (error) {
      console.error("BIND_FRACTURE:", error);
    }
  };

  return (
    <div className="p-8 text-white bg-black min-h-screen border border-gray-800">
      <h1 className="text-3xl font-bold mb-4">DAO Treasury Viewport</h1>
      
      <div className="mb-6 p-4 border border-gray-700 bg-gray-900">
        <h2 className="text-xl">VAULT_STATUS: <span className={vaultStatus === 'BOUND' ? 'text-green-500' : 'text-yellow-500'}>{vaultStatus}</span></h2>
        <p className="mt-2 text-gray-400">Total Incinerated Mass: {totalBurned}</p>
      </div>

      {vaultStatus === "UNBOUND" && (
        <button 
          onClick={handleGenesisBind}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
        >
          Execute Genesis Asset Initialization
        </button>
      )}
    </div>
  );
}