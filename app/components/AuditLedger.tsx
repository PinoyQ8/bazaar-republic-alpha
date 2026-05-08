"use client";

import { useState } from 'react';

export default function AuditLedger() {
  // 🛡️ ALPHA LOGS: These will be linked to Postgres in the next forge
  const [logs] = useState([
    { id: 1, event: "GENESIS_HANDSHAKE", status: "SUCCESS", ts: "2026-05-08 09:00:00" },
    { id: 2, event: "GATEKEEPER_SCREENING", status: "PASSED", ts: "2026-05-08 09:01:15" },
    { id: 3, event: "VAULT_ACCESS", status: "AUTHORIZED", ts: "2026-05-08 09:02:00" },
    { id: 4, event: "TREASURY_SYNC", status: "STABLE", ts: "2026-05-08 11:00:00" },
  ]);

  return (
    <div className="mt-8 border-t border-purple-900/50 pt-6">
      <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-4">
        Audit Matrix: Live Ledger
      </h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex justify-between items-center bg-gray-900/30 p-3 rounded border border-gray-800/50 hover:border-purple-900/50 transition-colors">
            <div className="text-left">
              <span className="text-[9px] text-gray-600 block mb-1 font-mono">{log.ts}</span>
              <span className="text-xs font-bold text-gray-300 tracking-tight">{log.event}</span>
            </div>
            <span className="text-[9px] font-black text-green-500 bg-green-900/10 px-2 py-1 rounded border border-green-900/30">
              {log.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}