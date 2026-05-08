"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function VerificationSector() {
  const [isBridgeHot, setIsBridgeHot] = useState(false);
  const [pioneer, setPioneer] = useState<any>(null);
  const initAttempted = useRef(false);

  // 🛡️ PRE-HEAT PROTOCOL: Force the ID: 1 Handshake on Mount
  useEffect(() => {
    if (initAttempted.current) return;

    // Inside VerificationSector.tsx
const preHeat = async () => {
  const piNode = (window as any).Pi; // 🛡️ Explicitly casting window to any
  if (piNode) {
    try {
      console.log("[MESH-SCAN] Pre-heating Bridge (Firing ID: 1)...");
      await piNode.init({ version: "2.0", sandbox: true });
          
          initAttempted.current = true;
          // 🛡️ 1500ms safety buffer for Sandbox acknowledgement
          setTimeout(() => {
            setIsBridgeHot(true);
            console.log("[MESH-SCAN] Bridge is HOT. 1-Click Seal Enabled.");
          }, 1500);
        } catch (err) {
          console.warn("[MESH-SCAN] Bridge Warm-up skipped:", err);
          setIsBridgeHot(true); 
        }
      }
    };

    const timer = setInterval(() => {
      if (window.Pi) {
        preHeat();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const handlePioneerSync = async () => {
    if (!isBridgeHot) return;

    try {
      console.log("[MESH-SCAN] Executing 1-Click Seal...");
      const onIncompletePaymentFound = (p: any) => console.log("Pending:", p);

      const auth = await window.Pi.authenticate(
        ['payments', 'username'], 
        onIncompletePaymentFound
      );
      
      setPioneer(auth.user);
      console.log("[MESH-SCAN] Handshake ID: 4 SEALED.");
    } catch (error) {
      console.error("[MESH-SCAN] 1-Click Fracture:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-900 border-2 border-blue-500/20 rounded-2xl shadow-inner">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full animate-pulse ${isBridgeHot ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          {isBridgeHot ? "Mesh Sync Active" : "Bridge Warming"}
        </span>
      </div>

      {pioneer ? (
        <div className="py-2 px-4 bg-green-500/10 border border-green-500/50 rounded text-green-400 font-mono text-sm">
          PIONEER::{pioneer.username.toUpperCase()}
        </div>
      ) : (
        <button 
          onClick={handlePioneerSync}
          disabled={!isBridgeHot}
          className={`relative px-10 py-3 font-bold rounded-lg overflow-hidden transition-all group ${
            isBridgeHot 
              ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95' 
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <span className="relative z-10">
            {isBridgeHot ? "VERIFY PIONEER" : "HEATING BRIDGE..."}
          </span>
          {/* 🛡️ CANONICAL TAILWIND v4 CLASSES APPLIED BELOW */}
          {isBridgeHot && (
            <div className="absolute inset-0 bg-linear-to-r from-blue-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
          )}
        </button>
      )}
    </div>
  );
}