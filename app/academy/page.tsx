"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AcademyDashboard() {
  const [activePioneer, setActivePioneer] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const [anchor, setAnchor] = useState<string>("");
  const [access, setAccess] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem("MESH_GENESIS_USER");
    const storedTier = localStorage.getItem("MESH_TIER") || "";
    const storedAnchor = localStorage.getItem("MESH_ANCHOR") || "";
    const storedAccess = JSON.parse(localStorage.getItem("MESH_ACCESS") || "[]");

    if (!user || !storedTier) {
      router.push("/");
    } else {
      setActivePioneer(user);
      setTier(storedTier);
      setAnchor(storedAnchor);
      setAccess(storedAccess);
    }
  }, [router]);

  if (!mounted || !activePioneer) return null;

  // 🛡️ DYNAMIC NODE LOGIC
  const academyNodes = [
    { 
      title: "SECURITY TRAINING", 
      status: "ACTIVE", 
      desc: "Hard-coding the MESH fundamentals.",
      href: "/academy/security",
      locked: false 
    },
    { 
      title: "CIRCLE OF ELDERS", 
      status: access.includes("SECURITY_CIRCLE") ? "ENCRYPTED" : "LOCKED", 
      desc: "The private Council war room for Alpha Group.",
      href: "/academy/elders-chat",
      locked: !access.includes("SECURITY_CIRCLE")
    },
    { 
      title: "mBZR ECONOMICS", 
      status: "STABLE", 
      desc: "Tokenomics and bridge utility logic.",
      href: "#",
      locked: true 
    },
    { 
      title: "DAO GOVERNANCE", 
      status: "LOCKED", 
      desc: "Republic voting and legislative protocols.",
      href: "#",
      locked: true 
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      
      {/* 🛡️ THE IDENTITY SHIELD */}
      <section className="p-1 rounded-2xl bg-linear-to-r from-blue-600/20 to-indigo-600/20 border border-slate-800">
        <div className="bg-slate-950/90 backdrop-blur-xl p-6 rounded-[14px] flex flex-col lg:flex-row justify-between gap-8">
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-400">{activePioneer.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-[10px] font-mono text-blue-500 tracking-[0.4em] uppercase">Verified Adjudicator</h2>
              <h1 className="text-3xl font-bold text-white tracking-tight">{activePioneer}</h1>
              <div className="flex gap-2 mt-2">
                {access.map(role => (
                  <span key={role} className="text-[8px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 uppercase">
                    {role.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 border-l border-slate-800 pl-8">
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Tier</p>
              <p className="text-sm font-bold text-blue-400 uppercase">{tier}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Anchor</p>
              <p className="text-sm font-bold text-green-400 uppercase">{anchor}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ THE UTILITY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {academyNodes.map((node) => (
          <Link 
            key={node.title} 
            href={node.locked ? "#" : node.href}
            className={`group p-6 rounded-xl border transition-all ${
              node.locked 
                ? 'border-slate-900 bg-slate-950/50 cursor-not-allowed opacity-60' 
                : 'border-slate-800 bg-slate-900/30 hover:border-blue-600/50 hover:bg-slate-900/50'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-2 h-2 rounded-full ${node.locked ? 'bg-slate-800' : 'bg-blue-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-mono text-slate-600 tracking-widest">{node.status}</span>
            </div>
            <h3 className={`text-lg font-bold transition-colors ${node.locked ? 'text-slate-600' : 'text-slate-100 group-hover:text-blue-400'}`}>
              {node.title}
            </h3>
            <p className="text-xs text-slate-500 mt-2 font-light leading-relaxed">{node.desc}</p>
          </Link>
        ))}
      </div>

      {/* 🛡️ MESH LOGS */}
      <section className="rounded-xl border border-slate-900 bg-slate-950/80 p-6 font-mono text-[11px]">
        <h4 className="text-[10px] text-slate-600 tracking-[0.3em] uppercase mb-4">Live MESH-SCAN Output</h4>
        <div className="space-y-1">
          <p className="text-blue-500/60">[{new Date().toLocaleTimeString()}] Handshake confirmed via J: Drive Node.</p>
          <p className="text-slate-700">[{new Date().toLocaleTimeString()}] Access granted to {access.length} secured sectors.</p>
          <p className="text-slate-700">[{new Date().toLocaleTimeString()}] Uptime Shield: 92% (MESH Protocol v23).</p>
        </div>
      </section>

    </div>
  );
}