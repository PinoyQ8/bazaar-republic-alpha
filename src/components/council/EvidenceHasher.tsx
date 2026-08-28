"use client";

import React, { useState } from "react";
import { computeSHA256, hashUploadedFile } from "@/lib/cryptoHasher";

interface EvidenceHasherProps {
  onHashGenerated?: (hash: string) => void;
}

export default function EvidenceHasher({ onHashGenerated }: EvidenceHasherProps) {
  const [textInput, setTextInput] = useState("");
  const [computedHash, setComputedHash] = useState("");
  const [fileName, setFileName] = useState("");
  const [isHashing, setIsHashing] = useState(false);

  const handleTextChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextInput(val);
    if (!val.trim()) {
      setComputedHash("");
      return;
    }
    const hash = await computeSHA256(val);
    setComputedHash(hash);
    if (onHashGenerated) onHashGenerated(hash);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsHashing(true);
    setFileName(file.name);
    try {
      const hash = await hashUploadedFile(file);
      setComputedHash(hash);
      if (onHashGenerated) onHashGenerated(hash);
    } catch (err) {
      console.error("Evidence hashing failed:", err);
    } finally {
      setIsHashing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-300">Tier 1 Evidence Cryptographic Hasher</span>
        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 font-mono">SHA-256</span>
      </div>

      <input
        type="text"
        placeholder="Paste pre-image payload or contract receipt..."
        value={textInput}
        onChange={handleTextChange}
        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
      />

      <div className="flex items-center gap-2">
        <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded py-1 px-2 text-center text-slate-300 transition">
          <span>{fileName ? `File: ${fileName}` : "Upload File Evidence"}</span>
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
        {isHashing && <span className="text-amber-400 text-[10px] animate-pulse">Hashing...</span>}
      </div>

      {computedHash && (
        <div className="bg-slate-950 p-2 rounded border border-cyan-900/50 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Generated SHA-256 Checksum:</div>
          <div className="font-mono text-cyan-300 break-all select-all">{computedHash}</div>
        </div>
      )}
    </div>
  );
}
