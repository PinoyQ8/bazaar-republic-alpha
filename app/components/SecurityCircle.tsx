// Location: app/components/SecurityCircle.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { addNodeToSecurityCircle } from "@/app/actions/security";
import { Shield, ShieldCheck, ShieldAlert, UserPlus, Users, Loader2 } from "lucide-react";

interface SecurityCircleProps {
  initialNodes?: string[];
  initialTrustScore?: number;
  onCircleUpdated?: (nodes: string[], score: number) => void;
}

export default function SecurityCircle({
  initialNodes = [],
  initialTrustScore = 100,
  onCircleUpdated,
}: SecurityCircleProps) {
  const { pioneer } = useAuth();
  const [nodes, setNodes] = useState<string[]>(initialNodes);
  const [trustScore, setTrustScore] = useState<number>(initialTrustScore);
  const [targetUsername, setTargetUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Sync initial props into internal state
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
    if (initialTrustScore !== undefined) {
      setTrustScore(initialTrustScore);
    }
  }, [initialNodes, initialTrustScore]);

  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = targetUsername.trim();

    if (!pioneer?.uid) {
      setFeedback({ type: "error", msg: "AUTHENTICATION_REQUIRED: Pioneer UID not found in session." });
      return;
    }

    if (!cleanUsername) {
      setFeedback({ type: "error", msg: "INVALID_INPUT: Target node username cannot be empty." });
      return;
    }

    if (nodes.includes(cleanUsername)) {
      setFeedback({ type: "info", msg: `NODE_EXISTS: ${cleanUsername} is already in your Security Circle.` });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await addNodeToSecurityCircle(pioneer.uid, cleanUsername);

      if (res.success && res.circle) {
        const updatedNodes = res.circle.nodes || [];
        const updatedScore = res.circle.trustScore ?? 100;

        setNodes(updatedNodes);
        setTrustScore(updatedScore);
        setTargetUsername("");
        setFeedback({ type: "success", msg: `NODE_ANCHORED: ${cleanUsername} linked to Security Circle.` });

        if (onCircleUpdated) {
          onCircleUpdated(updatedNodes, updatedScore);
        }
      } else {
        setFeedback({ type: "error", msg: res.message || "Failed to anchor node to Security Circle." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Network fault during cryptographic anchor." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQuorumReached = nodes.length >= 3;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-slate-200 shadow-xl space-y-4">
      {/* HEADER HUD */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
            Security Circle Mesh
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">TrustScore:</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            {trustScore.toFixed(1)}
          </span>
        </div>
      </div>

      {/* CONSENSUS PROGRESS */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Guardian Quorum (Min 3 / Recommended 5)</span>
          <span className={isQuorumReached ? "text-emerald-400 font-bold" : "text-amber-400"}>
            {nodes.length} / 5 Guardians
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              isQuorumReached ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: `${Math.min(100, (nodes.length / 5) * 100)}%` }}
          />
        </div>
      </div>

      {/* GUARDIAN NODE LIST */}
      <div className="space-y-2">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" /> Anchored Guardian Nodes
        </p>
        {nodes.length === 0 ? (
          <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-lg p-4 text-center text-xs text-slate-500">
            No guardian nodes anchored. Add trusted pioneers to fortify your recovery quorum.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nodes.map((nodeUsername, idx) => (
              <div
                key={`${nodeUsername}-${idx}`}
                className="flex items-center justify-between bg-slate-950 border border-slate-800/80 rounded px-3 py-2 text-xs"
              >
                <span className="text-slate-300 font-mono truncate">{nodeUsername}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD GUARDIAN FORM */}
      <form onSubmit={handleAddGuardian} className="pt-2 flex gap-2">
        <input
          type="text"
          value={targetUsername}
          onChange={(e) => setTargetUsername(e.target.value)}
          placeholder="Target Pioneer Username..."
          disabled={isSubmitting}
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition"
        />
        <button
          type="submit"
          disabled={isSubmitting || !targetUsername.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs px-4 py-2 rounded border border-emerald-500/40 flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserPlus className="w-3.5 h-3.5" />
          )}
          <span>Anchor</span>
        </button>
      </form>

      {/* FEEDBACK HUD */}
      {feedback && (
        <div
          className={`p-2.5 rounded border text-[11px] flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
              : feedback.type === "error"
              ? "bg-red-950/40 border-red-800 text-red-300"
              : "bg-slate-800/60 border-slate-700 text-slate-300"
          }`}
        >
          {feedback.type === "error" ? (
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          )}
          <span className="truncate">{feedback.msg}</span>
        </div>
      )}
    </div>
  );
}