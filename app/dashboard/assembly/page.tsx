// Location: app/dashboard/fireside/page.tsx
"use client";

import { useState } from "react";
import { Shield, Zap, HeartPulse, Lock, Globe, Terminal, CheckCircle2 } from "lucide-react";

export default function FiresideForumPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "quad_ledger" | "republic_shield" | "deadman">("overview");

  return (
    <div className="min-h-screen bg-black text-emerald-400 p-6 font-mono selection:bg-emerald-500 selection:text-black">
      {/* 🏛️ HEADER TELEMETRY */}
      <header className="border-b border-emerald-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs tracking-widest text-emerald-500 uppercase">
            <Terminal className="w-4 h-4" /> MESH-ADJUDICATOR // BROADCAST CHANNEL 01
          </div>
          // Update the header display text:
<h1 className="text-3xl font-bold tracking-tight text-white mt-1">
  THE REPUBLIC ASSEMBLY <span className="text-emerald-500">v23.0-ALPHA</span>
</h1>
<p className="text-sm text-emerald-600 mt-1">
  Official State of the Republic & Live-Fire Testing Ground for Real Pioneers.
</p>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-800/60 px-4 py-2 rounded text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          UPTIME SHIELD: 92% | NODE SYNC: STABLE
        </div>
      </header>

      {/* 🧭 NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-emerald-900 pb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-xs font-bold rounded transition-all ${
            activeTab === "overview" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-emerald-950/30 text-emerald-400 border border-emerald-900 hover:bg-emerald-900/40"
          }`}
        >
          🌐 1. THE REPUBLIC VISION
        </button>
        <button
          onClick={() => setActiveTab("quad_ledger")}
          className={`px-4 py-2 text-xs font-bold rounded transition-all ${
            activeTab === "quad_ledger" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-emerald-950/30 text-emerald-400 border border-emerald-900 hover:bg-emerald-900/40"
          }`}
        >
          📊 2. QUAD-LEDGER & mBZR
        </button>
        <button
          onClick={() => setActiveTab("republic_shield")}
          className={`px-4 py-2 text-xs font-bold rounded transition-all ${
            activeTab === "republic_shield" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-emerald-950/30 text-emerald-400 border border-emerald-900 hover:bg-emerald-900/40"
          }`}
        >
          🏥 3. REPUBLIC SHIELD (HEALTH)
        </button>
        <button
          onClick={() => setActiveTab("deadman")}
          className={`px-4 py-2 text-xs font-bold rounded transition-all ${
            activeTab === "deadman" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-emerald-950/30 text-emerald-400 border border-emerald-900 hover:bg-emerald-900/40"
          }`}
        >
          💀 4. DEADMAN PROTOCOL
        </button>
      </div>

      {/* 🖥️ CONTENT SECTORS */}
      <main className="space-y-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-950/10 border border-emerald-900/50 p-6 rounded-lg backdrop-blur">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-emerald-400" /> Exclusive Pi Network Architecture
              </h3>
              <p className="text-sm text-emerald-300/80 leading-relaxed mb-4">
                Project Bazaar operates exclusively within the Pi Network infrastructure. All transactions, collateral locks, and governance votes are executed in our native liquid token, <strong className="text-white">mBZR</strong>, anchored by a standardized conversion of <code className="bg-emerald-900/50 px-1.5 py-0.5 rounded text-emerald-300">1 Pi = 1000 mBZR</code>.
              </p>
              <div className="space-y-2 text-xs text-emerald-400/90">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Decentralized Autonomous Organization (DAO)</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero-Trust Trust Score Matrix (Up to 5% Tax Reduction)</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sub-45ms Mongoose Ledger Writes</div>
              </div>
            </div>

            <div className="bg-emerald-950/10 border border-emerald-900/50 p-6 rounded-lg backdrop-blur">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-emerald-400" /> What You Can Test Right Now
              </h3>
              <ul className="space-y-3 text-sm text-emerald-300/80">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">01.</span>
                  <span><strong>Sandbox Seeder:</strong> Inject 1,000,000 mBZR into your local node instantly via the Marketplace dashboard.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">02.</span>
                  <span><strong>Quad-Ledger Checkout:</strong> Execute test contracts and verify real-time mathematical splits across merchant yields, tax vaults, and e-VAT.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">03.</span>
                  <span><strong>Heir Configuration:</strong> Lock in your Deadman succession parameters and allocation percentages.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "quad_ledger" && (
          <div className="bg-emerald-950/10 border border-emerald-900/50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📊 The Quad-Ledger Transparency Matrix
            </h3>
            <p className="text-sm text-emerald-300/80 mb-6">
              When a Pioneer executes a transaction on the E-Network, the gross <code className="bg-emerald-900/50 px-1.5 py-0.5 rounded text-emerald-300">mBZR</code> total is instantly and immutably split into four distinct financial streams at the millisecond of settlement:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-black/60 border border-emerald-900 p-4 rounded">
                <div className="text-xs text-emerald-500 uppercase font-bold">Stream 01</div>
                <div className="text-lg font-bold text-white mt-1">Merchant Yield</div>
                <p className="text-xs text-emerald-400/70 mt-2">The net unit price routed directly to the service provider's liquid wallet.</p>
              </div>
              <div className="bg-black/60 border border-emerald-900 p-4 rounded">
                <div className="text-xs text-emerald-500 uppercase font-bold">Stream 02</div>
                <div className="text-lg font-bold text-white mt-1">DAO Operations (80%)</div>
                <p className="text-xs text-emerald-400/70 mt-2">Siphoned from the service tax to fund infrastructure, developer grants, and MESH upkeep.</p>
              </div>
              <div className="bg-black/60 border border-emerald-900 p-4 rounded">
                <div className="text-xs text-emerald-500 uppercase font-bold">Stream 03</div>
                <div className="text-lg font-bold text-white mt-1">Republic Shield (20%)</div>
                <p className="text-xs text-emerald-400/70 mt-2">Dedicated entirely to the decentralized health and social welfare safety net.</p>
              </div>
              <div className="bg-black/60 border border-emerald-900 p-4 rounded">
                <div className="text-xs text-emerald-500 uppercase font-bold">Stream 04</div>
                <div className="text-lg font-bold text-white mt-1">Government e-VAT (12%)</div>
                <p className="text-xs text-emerald-400/70 mt-2">Locked into the regulatory escrow vault for absolute legal and fiscal transparency.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "republic_shield" && (
          <div className="bg-emerald-950/10 border border-emerald-900/50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🏥 The Republic Shield: Health & Social Services
            </h3>
            <p className="text-sm text-emerald-300/80 mb-4 leading-relaxed">
              A true Republic must protect its Real Pioneers. The Republic Shield acts as an automated, decentralized safety net funded purely by transaction tax siphons. 
            </p>
            <div className="bg-black/40 border border-emerald-900/70 p-4 rounded mb-4">
              <h4 className="text-sm font-bold text-white mb-2">How Hardship Claims Work:</h4>
              <ul className="list-disc list-inside text-xs text-emerald-300/80 space-y-1">
                <li>Pioneers facing medical emergencies or social hardship submit a secure Hardship Contract.</li>
                <li>The contract requires cryptographic consensus from MESH Guardians (Tier-verified nodes).</li>
                <li>Once approved, grants are disbursed directly from the Republic Shield Vault with zero bureaucratic delay.</li>
              </ul>
            </div>
            <div className="text-xs text-emerald-500 italic">
              Status: Backend siphons active. Guardian Adjudication module staging for release.
            </div>
          </div>
        )}

        {activeTab === "deadman" && (
          <div className="bg-emerald-950/10 border border-emerald-900/50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              💀 The Deadman Protocol & Heir Succession
            </h3>
            <p className="text-sm text-emerald-300/80 mb-4 leading-relaxed">
              Absolute digital freedom requires absolute asset continuity. If a Pioneer's node goes dark beyond their custom trigger threshold (e.g., 365 days of heartbeat silence), the Deadman Protocol activates.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/60 border border-emerald-900 p-4 rounded">
                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-400" /> Proof-of-Life Pulse
                </h4>
                <p className="text-xs text-emerald-300/70">
                  Every interaction across the E-Network silently refreshes your timestamp, proving active node participation.
                </p>
              </div>
              <div className="bg-black/60 border border-emerald-900 p-4 rounded">
                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" /> Decentralized Heir Matrix
                </h4>
                <p className="text-xs text-emerald-300/70">
                  Pioneers assign designated Heir UIDs and strict percentage allocations (totaling exactly 100%) to safely inherit staked collateral and `mBZR` balances.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 🏛️ FOOTER TELEMETRY */}
      <footer className="mt-12 border-t border-emerald-900/60 pt-6 text-center text-xs text-emerald-700">
        PROJECT BAZAAR DAO // THE MESH PROTOCOL // SECURED ON X570 WORKSTATION NODE
      </footer>
    </div>
  );
}