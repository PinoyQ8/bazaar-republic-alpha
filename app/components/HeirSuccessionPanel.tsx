"use client";

import React, { useState } from "react";
import {
  Clock,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface HeirSuccessionProps {
  founderAddress: string;
  isFounder: boolean;
}

type SuccessionState =
  | "FOUNDER_ACTIVE"
  | "SUCCESSION_GRACE"
  | "DESCENDANTS_ACTIVE";

export default function HeirSuccessionPanel({
  founderAddress,
  isFounder,
}: HeirSuccessionProps) {
  const { pioneer } = useAuth();
  const [lastCheckIn, setLastCheckIn] = useState<string>(
    new Date().toISOString()
  );
  const [state, setState] = useState<SuccessionState>("FOUNDER_ACTIVE");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const designatedHeirs = [
    "GAU5Y5UWUQ5ETIEI5HWVJR7VDMXUETTSKQ4UKOIIGIW6GVIMCR354UJ3",
    "GD7XBZ6YRE5BXM73O7N2Z...",
  ];

  const runAction = async (
    action: "PING" | "TRIGGER_GRACE" | "RETIRE_FOUNDER"
  ) => {
    const uid = pioneer?.uid || "BAZAAR_FOUNDER";
    setBusyAction(action);
    setFeedback(null);
    try {
      const res = await fetch("/api/founder/succession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Succession request failed.");
      }
      setState(data.state as SuccessionState);
      if (data.lastCheckIn) {
        setLastCheckIn(data.lastCheckIn);
      }
      if (action === "PING") {
        setFeedback("Heartbeat recorded. 90-day inactivity timer reset.");
      } else if (action === "TRIGGER_GRACE") {
        setFeedback("14-day succession grace window simulated.");
      } else {
        setFeedback("Founder retired. Descendants unlocked for Chamber 1.");
      }
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : "Succession action failed."
      );
    } finally {
      setBusyAction(null);
    }
  };

  const descendantsBadge =
    state === "DESCENDANTS_ACTIVE"
      ? "Descendants: ACTIVE"
      : state === "SUCCESSION_GRACE"
      ? "Descendants: STANDBY"
      : "Descendants: DORMANT";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-2xl space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold text-white tracking-wider uppercase">
            Heir Succession Protocol
          </h2>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
          90d Switch • 14d Grace
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-neutral-500 block uppercase">
            Root Founder
          </span>
          <span className="text-[11px] text-zinc-300 truncate block font-sans">
            {founderAddress
              ? `${founderAddress.slice(0, 6)}...${founderAddress.slice(-4)}`
              : "Not Connected"}
          </span>
        </div>
        <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-neutral-500 block uppercase">
            Chamber 1 State
          </span>
          <span
            className={`text-[11px] font-bold flex items-center gap-1 ${
              state === "DESCENDANTS_ACTIVE"
                ? "text-amber-400"
                : state === "SUCCESSION_GRACE"
                ? "text-rose-400"
                : "text-emerald-400"
            }`}
          >
            <Clock size={12} /> {state}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-neutral-950/80 px-3 py-2 rounded-xl border border-neutral-800 text-[10px]">
        <span className="text-zinc-400">{descendantsBadge}</span>
        <span className="text-zinc-500 truncate max-w-[155px]">
          Ping: {new Date(lastCheckIn).toLocaleTimeString()}
        </span>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
          Designated Trustee Quorum (2-of-3 Multisig)
        </span>
        <div className="space-y-1.5">
          {designatedHeirs.map((heir, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-800 text-[10px]"
            >
              <span className="text-neutral-300 font-sans">{heir}</span>
              <span className="text-cyan-400 font-bold">
                Trustee #{index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isFounder && (
        <div className="space-y-2 pt-2 border-t border-neutral-800">
          <button
            onClick={() => runAction("PING")}
            disabled={busyAction !== null}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
          >
            {busyAction === "PING" ? (
              <>
                <RefreshCw size={14} className="animate-spin text-slate-950" />
                Broadcasting Heartbeat...
              </>
            ) : (
              <>
                <UserCheck size={14} />
                <span>Transmit Founder Heartbeat (Ping)</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => runAction("TRIGGER_GRACE")}
              disabled={busyAction !== null}
              className="py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 border border-zinc-700 text-amber-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <ShieldAlert size={12} />
              <span>Test 14d Grace</span>
            </button>
            <button
              onClick={() => runAction("RETIRE_FOUNDER")}
              disabled={busyAction !== null}
              className="py-2 bg-rose-950/50 hover:bg-rose-900/50 disabled:opacity-50 border border-rose-800/70 text-rose-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <UserMinus size={12} />
              <span>Retire Founder</span>
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p className="text-[10px] text-cyan-300 bg-cyan-950/30 border border-cyan-800/50 rounded-xl px-3 py-2">
          {feedback}
        </p>
      )}
    </div>
  );
}