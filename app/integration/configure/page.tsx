"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

interface SyncState {
  status: "idle" | "loading" | "success" | "error";
  message: string;
}

function ConfigureContent() {
  const searchParams = useSearchParams();
  const configurationId = searchParams.get("configurationId") || "icfg_demo_sandbox";
  const projectId = searchParams.get("projectId") || "prj_bazaar_alpha";

  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    message: "",
  });

  const [ledgerEnv, setLedgerEnv] = useState<"production" | "testnet">("production");

  const injectedVariables = [
    { key: "DATABASE_URL", target: "Neon Serverless Pool", status: "Active" },
    { key: "PI_NETWORK_ENV", target: ledgerEnv, status: "Active" },
    { key: "PI_API_ENDPOINT", target: "https://api.minepi.com", status: "Active" },
    { key: "PI_COMMERCE_MEMO_PREFIX", target: "BZR-V23-", status: "Active" },
  ];

  const handleForceSync = async () => {
    setSyncState({ status: "loading", message: "Synchronizing environment variables..." });

    try {
      const res = await fetch("/api/integration/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configurationId, projectId, ledgerEnv }),
      });

      if (!res.ok) {
        throw new Error("Sync failed. Check Vercel API authorization.");
      }

      setSyncState({
        status: "success",
        message: "Environment variables successfully synchronized with Vercel edge.",
      });
    } catch (err: unknown) {
      setSyncState({
        status: "error",
        message: err instanceof Error ? err.message : "Sync failed.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Bazaar Republic Node Configuration
              </h1>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Manage connected Vercel deployments, ledger endpoints, and secret injection.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300">
            <span className="text-zinc-500">Config ID:</span>
            <span className="text-amber-400 truncate max-w-40">{configurationId}</span>
          </div>
        </div>

        {/* Status Banners */}
        {syncState.status !== "idle" && (
          <div
            className={`p-4 rounded-lg border text-sm flex items-center justify-between ${
              syncState.status === "loading"
                ? "bg-amber-950/30 border-amber-800/50 text-amber-200"
                : syncState.status === "success"
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-200"
                : "bg-rose-950/30 border-rose-800/50 text-rose-200"
            }`}
          >
            <span>{syncState.message}</span>
            <button
              onClick={() => setSyncState({ status: "idle", message: "" })}
              className="text-xs uppercase tracking-wider font-semibold opacity-70 hover:opacity-100 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Integration Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Integration State
            </div>
            <div className="text-lg font-semibold text-emerald-400 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Installed & Active
            </div>
            <div className="text-xs text-zinc-500 mt-1">OAuth Token Validated</div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Target Project
            </div>
            <div className="text-lg font-semibold text-zinc-100 mt-2 truncate font-mono">
              {projectId}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Vercel Production Scope</div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Settlement Engine
            </div>
            <div className="text-lg font-semibold text-amber-400 mt-2">Stellar Horizon SCP</div>
            <div className="text-xs text-zinc-500 mt-1">Non-Custodial A2U/U2A</div>
          </div>
        </div>

        {/* Environment Variable Audit Table */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Managed Environment Secrets</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Variables auto-injected into your Vercel project deployment target.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              4 Keys Managed
            </span>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {injectedVariables.map((v) => (
              <div key={v.key} className="px-6 py-3.5 flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-bold text-amber-300">{v.key}</span>
                  <span className="font-mono text-xs text-zinc-500 truncate max-w-sm">
                    {v.target}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-6 space-y-6">
          <h2 className="text-base font-semibold text-white">Target Ledger Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
              <div>
                <div className="font-medium text-sm text-zinc-200">Mainnet Production</div>
                <div className="text-xs text-zinc-500">Live Pi Ledger Settlement</div>
              </div>
              <input
                type="radio"
                name="ledger"
                value="production"
                checked={ledgerEnv === "production"}
                onChange={() => setLedgerEnv("production")}
                className="w-4 h-4 text-amber-500 focus:ring-amber-400 bg-zinc-800 border-zinc-700"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
              <div>
                <div className="font-medium text-sm text-zinc-200">Testnet Sandbox</div>
                <div className="text-xs text-zinc-500">Developer Horizon RPC</div>
              </div>
              <input
                type="radio"
                name="ledger"
                value="testnet"
                checked={ledgerEnv === "testnet"}
                onChange={() => setLedgerEnv("testnet")}
                className="w-4 h-4 text-amber-500 focus:ring-amber-400 bg-zinc-800 border-zinc-700"
              />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Applying changes updates variables across Production, Preview, and Development.
            </p>
            <button
              onClick={handleForceSync}
              disabled={syncState.status === "loading"}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm transition"
            >
              {syncState.status === "loading" ? "Syncing..." : "Force Re-Sync Variables"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationConfigurePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm font-mono">
          Loading Node Configuration...
        </div>
      }
    >
      <ConfigureContent />
    </Suspense>
  );
}