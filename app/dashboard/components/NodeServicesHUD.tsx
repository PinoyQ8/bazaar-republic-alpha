"use client";

import React, { useState, useEffect } from "react";

interface ManagedService {
  serviceId: string;
  name: string;
  port: number;
  gatewayPath: string;
  isEnabled: boolean;
  updatedAt: string | null;
}

export default function NodeServicesHUD() {
  const [services, setServices] = useState<ManagedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [pingStatus, setPingStatus] = useState<Record<string, { status: number | string; latency: number }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/node/services");
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (err) {
      console.error("Failed to load node services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggle = async (serviceId: string, currentStatus: boolean) => {
    setBusyId(serviceId);
    const targetStatus = !currentStatus;

    setServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, isEnabled: targetStatus } : s))
    );

    try {
      const res = await fetch("/api/node/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, isEnabled: targetStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchServices();
      }
    } catch {
      fetchServices();
    } finally {
      setBusyId(null);
    }
  };

  const runPing = async (service: ManagedService) => {
    const start = performance.now();
    try {
      const res = await fetch(`/api/gateway?path=${service.gatewayPath}`);
      const duration = Math.round(performance.now() - start);
      setPingStatus((prev) => ({
        ...prev,
        [service.serviceId]: { status: res.status, latency: duration },
      }));
    } catch {
      setPingStatus((prev) => ({
        ...prev,
        [service.serviceId]: { status: "ERR", latency: 0 },
      }));
    }
  };

  return (
    <div className="p-3 bg-zinc-900/40 border border-zinc-800/70 rounded-xl space-y-3 font-mono text-slate-100">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Co-Hosted Sibling Gateway
          </span>
        </div>
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Protocol 28</span>
      </div>

      {loading ? (
        <div className="py-4 text-center text-[10px] text-zinc-500 animate-pulse">
          Querying local node topology...
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((service) => {
            const isToggling = busyId === service.serviceId;
            const probe = pingStatus[service.serviceId];

            return (
              <div
                key={service.serviceId}
                className="p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-lg flex justify-between items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-zinc-200 truncate">{service.name}</span>
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded">
                      :{service.port}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center space-x-2">
                    <span className="truncate">/{service.gatewayPath}</span>
                    {probe && (
                      <span
                        className={`text-[9px] px-1 rounded ${
                          probe.status === 200
                            ? "text-emerald-400 bg-emerald-950/50"
                            : "text-amber-400 bg-amber-950/50"
                        }`}
                      >
                        {probe.status} ({probe.latency}ms)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => runPing(service)}
                    className="px-2 py-0.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700/60 transition-colors"
                  >
                    Ping
                  </button>

                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggle(service.serviceId, service.isEnabled)}
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                      service.isEnabled
                        ? "bg-emerald-950/50 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/50"
                        : "bg-red-950/40 border-red-800/60 text-red-400 hover:bg-red-900/50"
                    } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {service.isEnabled ? "ACTIVE" : "PAUSED"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
