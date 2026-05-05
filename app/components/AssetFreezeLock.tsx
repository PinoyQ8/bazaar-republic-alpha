"use client";
import { useState, useRef } from 'react';

export default function AssetFreezeLock() {
  const [progress, setProgress] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  
  // Strictly typing the refs to accept timer IDs or null
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = () => {
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 1 : 100));
    }, 30);

    holdTimerRef.current = setTimeout(() => {
      executeFreezeProtocol();
    }, 3000);
  };

  const cancelHold = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setProgress(0); 
  };

  const executeFreezeProtocol = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setIsLocked(true);
    console.log("MESH-SCAN: Deadman Freeze Initiated.");
  };

  return (
    <div className="relative w-full max-w-87.5 mx-auto bg-gray-900 rounded-lg overflow-hidden border border-red-900">
      <div 
        className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-75 ease-linear"
        style={{ width: `${progress}%` }}
      />
      
      <button 
        className="relative z-10 w-full py-4 text-white font-bold tracking-widest uppercase select-none"
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
      >
        {isLocked ? "VAULT LOCKED" : "HOLD TO FREEZE ASSETS"}
      </button>
    </div>
  );
}