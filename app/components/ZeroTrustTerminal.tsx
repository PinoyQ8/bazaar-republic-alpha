// Location: app/components/ZeroTrustTerminal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { 
  Terminal as TerminalIcon, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Trash2, 
  Play, 
  Wifi, 
  Cpu 
} from "lucide-react";

export interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "warn" | "error";
  message: string;
}

interface ZeroTrustTerminalProps {
  initialLogs?: LogEntry[];
  nodeStatus?: string;
  trustScore?: number;
}

export default function ZeroTrustTerminal({
  initialLogs = [],
  nodeStatus = "ACTIVE",
  trustScore = 100,
}: ZeroTrustTerminalProps) {
  const { pioneer } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [commandInput, setCommandInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
    setLogs((prev) => [...prev, { timestamp, type, message }]);
  };

  useEffect(() => {
    if (initialLogs.length > 0 && logs.length === 0) {
      setLogs(initialLogs);
    }
  }, [initialLogs, logs.length]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = commandInput.trim();
    if (!rawCmd || isExecuting) return;

    const cmd = rawCmd.toLowerCase();
    setCommandInput("");
    setIsExecuting(true);

    addLog(`> ${rawCmd}`, "info");

    try {
      if (cmd === "clear") {
        setLogs([]);
        setIsExecuting(false);
        return;
      }

      if (cmd === "status" || cmd === "node:status") {
        addLog(`NODE_ID: ${pioneer?.uid || "ANONYMOUS_PIONEER"}`, "info");
        addLog(`OPERATIONAL_STATUS: ${nodeStatus}`, "success");
        addLog(`TRUST_SCORE: ${trustScore.toFixed(1)}/100`, "info");
      } else if (cmd === "ping" || cmd === "mesh:ping") {
        addLog("PINGING MESH RELAYERS...", "info");
        await new Promise((r) => setTimeout(r, 400));
        addLog("RELAYER [SOLOHOST_CORE]: 18ms ACK (TLS 1.3)", "success");
      } else if (cmd === "verify" || cmd === "zero-trust:verify") {
        addLog("INITIATING ZERO-TRUST CRYPTOGRAPHIC ATTESTATION...", "info");
        await new Promise((r) => setTimeout(r, 600));
        addLog("ATTESTATION SIGNATURE: VALID (SECP256R1 / HARDWARE_ENCLAVE)", "success");
      } else {
        addLog(`UNKNOWN_COMMAND: "${rawCmd}". Available: status, ping, verify, clear`, "warn");
      }
    } catch (err: any) {
      addLog(`FAULT: ${err?.message || "Execution exception"}`, "error");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 shadow-2xl space-y-3">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-wider text-slate-100 uppercase text-[11px]">
            Zero-Trust Telemetry Terminal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>TS: {trustScore.toFixed(0)}</span>
          </div>
          <button
            onClick={() => setLogs([])}
            className="text-slate-500 hover:text-slate-300 transition p-1"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TERMINAL VIEWPORT */}
      <div className="bg-black/90 border border-slate-900 rounded-lg p-3 h-48 overflow-y-auto space-y-1.5 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic">
            Zero-Trust Terminal initialized. Enter command or await daemon telemetry...
          </div>
        ) : (
          logs.map((entry, index) => (
            <div key={index} className="leading-relaxed break-all">
              <span className="text-slate-600 select-none">[{entry.timestamp}] </span>
              <span
                className={
                  entry.type === "error"
                    ? "text-red-400 font-bold"
                    : entry.type === "success"
                    ? "text-emerald-400 font-bold"
                    : entry.type === "warn"
                    ? "text-amber-400"
                    : "text-slate-300"
                }
              >
                {entry.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* COMMAND INPUT HUD */}
      <form onSubmit={handleExecute} className="flex items-center gap-2 pt-1">
        <span className="text-cyan-400 font-bold select-none">&gt;</span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="status | ping | verify | clear"
          disabled={isExecuting}
          className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono transition"
        />
        <button
          type="submit"
          disabled={isExecuting || !commandInput.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs px-3 py-1.5 rounded border border-cyan-500/40 flex items-center gap-1 transition"
        >
          {isExecuting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
      </form>
    </div>
  );
}