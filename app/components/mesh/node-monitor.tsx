"use client";

import { useEffect, useState } from "react";

export default function NodeMonitor() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [status, setStatus] = useState<string>("SCANNING...");

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/node-telemetry');
      const data = await res.json();
      
      if (data.status === "LIVE") {
        setTelemetry(data.telemetry);
        setStatus("SYNCED");
      } else {
        setStatus("OFFLINE");
      }
    } catch (error) {
      setStatus("FRACTURE");
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // 🛡️ Auto-refresh the pulse every 15 seconds
    const interval = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border border-green-500 bg-black text-green-400 font-mono max-w-md">
      <div className="border-b border-green-500 pb-2 mb-2 flex justify-between">
        <span>X570 MESH-SCAN: PROTOCOL {telemetry?.protocol || "23"} FORGE</span>
        <span className={status === "SYNCED" ? "animate-pulse text-green-300" : "text-red-500"}>
          {status}
        </span>
      </div>
      
      {telemetry ? (
        <div className="space-y-1 text-sm">
          <p>[Engine State] : <span className="text-white">{telemetry.state}</span></p>
          <p>[Protocol DNA] : <span className="text-white">v{telemetry.protocol}</span></p>
          <p>[Ledger Block] : <span className="text-white">{telemetry.ledger.toLocaleString()}</span></p>
          <p>[Uptime Pulse] : <span className="text-white">{telemetry.uptime_pulse} seconds behind network</span></p>
          <p className="pt-2 border-t border-green-900 mt-2 text-gray-400">
            [Active Peers] : {telemetry.peers.total} Total Connections
          </p>
          <p className="text-gray-400">
            [Traffic Map]  : {telemetry.peers.outbound} Outbound | {telemetry.peers.inbound} Inbound
          </p>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">Awaiting Consensus Data...</div>
      )}
    </div>
  );
}