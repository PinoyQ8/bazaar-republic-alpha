"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ProtocolForgeSector() {
  const { pioneer } = useAuth();
  const [isCompiling, setIsCompiling] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  const defaultTemplate = 
`{
  "directive": "UPTIME_SHIELD",
  "target": 92,
  "enforce": true,
  "signature": "REQUIRED",
  "node": "${pioneer?.username || "UNKNOWN_NODE"}"
}`;

  const [protocolLogic, setProtocolLogic] = useState(defaultTemplate);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal when new logs hit
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const addLog = (message: string) => {
    setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ${message}`]);
  };

  const handleCompile = async () => {
    if (isCompiling || !protocolLogic.trim()) return;

    setIsCompiling(true);
    setTerminalLogs([]); // Clear previous compile
    addLog(`Initiating logic compile for node: ${pioneer?.username || "GUEST"}...`);

    try {
      // 1. Syntax Check Delay
      await new Promise(resolve => setTimeout(resolve, 600));
      JSON.parse(protocolLogic); // Will throw if invalid JSON
      addLog("🟢 Syntax Adjudicator: JSON structure valid.");
      
      // 2. Protocol Validation Delay
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog("🟢 MESH-SCAN: Protocol parameters fall within DAO limits.");
      
      // 3. Final Signature Delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog("✅ COMPILATION SUCCESS: Logic ready for Mainnet sync.");

    } catch (error) {
      addLog("🚨 FATAL: Syntax fracture detected.");
      addLog("Adjudicator: Ensure strict JSON formatting. Compilation aborted.");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 animate-in fade-in duration-700">
      
      {/* 🛡️ VIEWPORT LOCK: max-w-sm aligns with S23 Ultra */}
      <div className="flex flex-col flex-1 w-full max-w-sm mx-auto p-4 space-y-4">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/academy" 
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-purple-400 hover:border-purple-500/50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="font-mono text-xl font-bold text-slate-100 uppercase tracking-tighter">
                Logic Forge
              </h1>
              <p className="text-[10px] font-mono text-purple-500 tracking-widest uppercase">
                Protocol Compiler
              </p>
            </div>
          </div>
        </div>

        {/* ⌨️ The Editor Workspace */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Workspace (mesh_rules.json)
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isCompiling ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></span>
            </span>
          </div>
          
          <textarea
            value={protocolLogic}
            onChange={(e) => setProtocolLogic(e.target.value)}
            disabled={isCompiling}
            spellCheck="false"
            className="flex-1 w-full bg-slate-900/80 border border-slate-800 rounded-lg p-4 font-mono text-xs text-purple-300 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none disabled:opacity-50 shadow-inner custom-scrollbar leading-relaxed"
          />
        </div>

        {/* 🚀 Execution Bridge */}
        <button
          onClick={handleCompile}
          disabled={isCompiling || !protocolLogic.trim()}
          className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-400 font-mono text-xs font-bold rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompiling ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
              Forging Logic...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Compile Protocol
            </>
          )}
        </button>

        {/* 💻 Terminal Readout */}
        <div className="h-32 bg-black border border-slate-800 rounded-lg p-3 overflow-hidden flex flex-col relative">
          <div className="absolute top-0 left-0 right-0 bg-slate-900/90 border-b border-slate-800 px-3 py-1 z-10 flex items-center gap-2">
            <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Adjudicator Log
            </span>
          </div>
          <div ref={terminalRef} className="flex-1 overflow-y-auto mt-6 custom-scrollbar space-y-1">
            {terminalLogs.length === 0 ? (
              <p className="text-[10px] font-mono text-slate-600 italic">Waiting for compiler...</p>
            ) : (
              terminalLogs.map((log, i) => (
                <p key={i} className="text-[10px] font-mono text-slate-400">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}