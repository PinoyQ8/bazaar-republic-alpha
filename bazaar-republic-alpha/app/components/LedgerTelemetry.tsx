'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, CheckCircle2, XCircle } from 'lucide-react';

// Define the exact shape of our Prisma data
interface LedgerLog {
  id: string;
  uid: string;
  amount: string;
  asset: string;
  txHash: string;
  status: string;
  timestamp: string;
}

export default function LedgerTelemetry() {
  const [logs, setLogs] = useState<LedgerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/ledger/deposit'); // 🛡️ THE MESH OVERRIDE
        const data = await res.json();
        
        if (data.status === 'SUCCESS') {
          setLogs(data.data);
        } else {
          setError(data.message || 'Failed to sync with Master Index.');
        }
      } catch (err) {
        setError('Network fracture detected.');
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  // Utility to truncate long Horizon hashes for the S23 Viewport
  const truncateHash = (hash: string) => {
    if (!hash || hash.length < 12) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // Utility to format ISO timestamps into terminal readouts
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="w-full max-w-[384px] mx-auto border border-green-500/30 bg-black/80 shadow-[0_0_15px_rgba(34,197,94,0.1)] rounded-sm font-mono mt-4 mb-8">
      {/* Terminal Header */}
      <div className="border-b border-green-500/50 p-3 flex items-center justify-between bg-green-950/20">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-green-500" />
          <h2 className="text-sm font-bold text-green-500 tracking-widest uppercase">Master Index</h2>
        </div>
        <Activity size={14} className={`text-green-500 ${loading ? 'animate-spin' : 'animate-pulse'}`} />
      </div>

      {/* Telemetry Viewport */}
      <div className="p-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="w-full h-1 bg-green-900 overflow-hidden">
              <div className="w-1/2 h-full bg-green-500 animate-ping mx-auto"></div>
            </div>
            <p className="text-[10px] text-green-600 tracking-widest animate-pulse uppercase">Syncing E-Network...</p>
          </div>
        ) : error ? (
          <div className="py-6 text-center border border-red-900/50 bg-red-950/20 text-red-500 text-xs">
            [SYS_ERR] {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-6 text-center text-[10px] text-green-700 uppercase tracking-widest">
            No distributions recorded.
          </div>
        ) : (
          <div className="space-y-3 max-h-100 overflow-y-auto pr-1 custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="border border-green-900/40 bg-black p-2 text-xs relative group">
                
                {/* Status Indicator */}
                <div className="absolute top-2 right-2">
                  {log.status === 'SUCCESS' 
                    ? <CheckCircle2 size={12} className="text-green-500" /> 
                    : <XCircle size={12} className="text-red-500" />
                  }
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-green-700 tracking-widest uppercase">{formatTime(log.timestamp)}</div>
                  <div className="font-bold text-green-400">{log.uid}</div>
                  <div className="flex justify-between items-center border-t border-green-900/30 pt-1 mt-1">
                    <span className="text-green-300">{log.amount} {log.asset}</span>
                    <span className="text-[10px] text-green-600 bg-green-950/30 px-1 rounded-sm">{truncateHash(log.txHash)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}