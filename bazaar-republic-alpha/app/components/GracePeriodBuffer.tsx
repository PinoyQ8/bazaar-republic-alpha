"use client";

import { useState, useEffect } from 'react';

// --- TYPE-2 DEFENSE: INTERCEPTION UI ---
interface GracePeriodProps {
  onAuthorize: () => void; // Function to run when the transfer is confirmed
  onStasis: () => void;    // Function to run when the Pioneer slams the Vault shut
}

export default function GracePeriodBuffer({ onAuthorize, onStasis }: GracePeriodProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    // The countdown engine
    if (timeLeft <= 0) {
      // Auto-Authorize when the timer expires (Standard blockchain behavior)
      onAuthorize();
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    // Cleanup to prevent memory leaks in the MESH
    return () => clearInterval(timerInterval);
  }, [timeLeft, onAuthorize]);

  return (
    <div className="w-full flex flex-col items-center border border-yellow-500/50 bg-black p-6 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.2)]">
      
      <div className="flex items-center justify-center gap-3 mb-4 text-yellow-500">
        <span className="material-icons animate-pulse text-2xl">security</span>
        <h2 className="text-xl font-bold uppercase tracking-widest text-center">Interception Shield Active</h2>
      </div>

      <p className="text-gray-400 text-sm text-center mb-6">
        Transaction pending. You have 60 seconds to review the destination address. 
        If you suspect a breach, engage STASIS immediately.
      </p>

      {/* The Visual Timer */}
      <div className="text-6xl font-black text-yellow-500 mb-8 font-mono tracking-widest">
        00:{timeLeft.toString().padStart(2, '0')}
      </div>

      {/* The Control Array */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Safe: Authorize Early */}
        <button 
          onClick={onAuthorize}
          className="w-full py-4 bg-gray-900 hover:bg-green-900 border border-green-500 text-green-500 hover:text-white font-bold uppercase tracking-widest rounded transition-all flex justify-center items-center gap-2"
        >
          <span className="material-icons">check_circle</span>
          Authorize Now
        </button>

        {/* Critical: Slam the Vault */}
        <button 
          onClick={onStasis}
          className="w-full py-4 bg-red-900 hover:bg-red-800 text-white font-black border-2 border-red-500 uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] flex justify-center items-center gap-2"
        >
          <span className="material-icons">lock</span>
          Engage Stasis
        </button>

      </div>
    </div>
  );
}