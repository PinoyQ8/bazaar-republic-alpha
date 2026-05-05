"use client";
import { useState, useEffect } from 'react';

// TypeScript Interface to lock the MESH routing props
interface GracePeriodProps {
  abortFreeze: () => void;
  executeImmediateLock: () => void;
}

export default function GracePeriodBuffer({ abortFreeze, executeImmediateLock }: GracePeriodProps) {
  // --- STATE MEMORY ---
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [meshLogs, setMeshLogs] = useState<string[]>([]);

  // --- TERMINAL LOGGING LOGIC ---
  const addLog = (message: string) => {
    setMeshLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
      // Keep terminal clean, max 4 lines
      return newLogs.length > 4 ? newLogs.slice(1) : newLogs; 
    });
  };

  // --- INTERCEPTION COUNTDOWN ---
  useEffect(() => {
    addLog("WARNING: Asset Freeze Sequence Initiated.");
    addLog("60-Second Interception Shield Active.");

    if (timeLeft <= 0) {
      addLog("TIMER EXPIRED: Executing Hard Lock...");
      executeImmediateLock();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, executeImmediateLock]);

  // --- VIEWPORT RENDERING ---
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-950 px-4 py-10 font-mono">
      
      <div className="w-full max-w-md border border-red-900 bg-black p-8 rounded-xl shadow-[0_0_30px_rgba(153,27,27,0.3)] flex flex-col items-center">
        
        {/* Header Alert */}
        <div className="text-center mb-8 w-full border-b border-red-900 pb-4">
          <h2 className="text-red-600 font-black tracking-widest uppercase text-2xl animate-pulse">
            Critical Warning
          </h2>
          <p className="text-gray-400 text-xs mt-2 uppercase tracking-wider">
            MESH co-signing privileges pending revocation.
          </p>
        </div>

        {/* Cryptographic Clock */}
        <div className="text-7xl font-black text-white mb-10 tabular-nums tracking-tighter">
          00:{timeLeft.toString().padStart(2, '0')}
        </div>

        {/* Execution Commands */}
        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={abortFreeze}
            className="w-full py-4 bg-green-700 hover:bg-green-600 text-white font-extrabold text-lg tracking-widest rounded shadow-[0_0_15px_rgba(22,163,74,0.3)] transition-all"
          >
            ABORT / CANCEL
          </button>

          <button 
            onClick={() => {
              addLog("OVERRIDE: Forcing immediate stasis lock.");
              executeImmediateLock();
            }}
            className="w-full py-4 bg-transparent border border-red-800 text-red-500 hover:bg-red-950 hover:text-red-400 font-bold tracking-widest uppercase rounded transition-colors"
          >
            Force Lock Immediately
          </button>
        </div>

        {/* MESH Terminal Output */}
        <div className="mt-8 w-full bg-gray-900 p-3 rounded h-24 overflow-y-auto border border-gray-800 text-[10px] text-gray-500">
          {meshLogs.map((log, index) => (
             <div key={index} className="mb-1">{log}</div>
          ))}
        </div>

      </div>
    </div>
  );
}