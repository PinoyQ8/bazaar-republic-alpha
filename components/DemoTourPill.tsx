// Location: components/DemoTourPill.tsx
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, X } from "lucide-react";

export const DEMO_ACTIVE_KEY = "bazaar_demo_tour_active";
export const DEMO_STEP_KEY = "bazaar_demo_step";
export const DEMO_TOUR_EVENT = "bazaar-demo-tour-change";

export default function DemoTourPill() {
  const pathname = usePathname();
  const router = useRouter();
  const [isTourActive, setIsTourActive] = useState(false);
  const [stepLabel, setStepLabel] = useState("01");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTourState = () => {
      const active = window.sessionStorage.getItem(DEMO_ACTIVE_KEY) === "true";
      const rawStep = Number(window.sessionStorage.getItem(DEMO_STEP_KEY) || "0");
      const safeStep = Number.isNaN(rawStep) ? 0 : Math.max(0, rawStep);
      setIsTourActive(active);
      setStepLabel(String(safeStep + 1).padStart(2, "0"));
    };

    syncTourState();
    window.addEventListener(DEMO_TOUR_EVENT, syncTourState);
    window.addEventListener("storage", syncTourState);
    return () => {
      window.removeEventListener(DEMO_TOUR_EVENT, syncTourState);
      window.removeEventListener("storage", syncTourState);
    };
  }, [pathname]);

  if (!isTourActive || pathname === "/demo") {
    return null;
  }

  const exitTourMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(DEMO_ACTIVE_KEY);
    window.dispatchEvent(new Event(DEMO_TOUR_EVENT));
    setIsTourActive(false);
  };

  return (
    <div className="fixed bottom-24 right-3 z-40 max-w-[384px] flex items-center gap-1 rounded-full border border-cyan-500/60 bg-slate-900/95 px-2.5 py-1.5 text-[10px] font-mono text-cyan-200 shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={() => router.push("/demo")}
        className="flex items-center gap-1.5 font-bold hover:text-white transition-colors"
      >
        <Compass className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span>Return to /demo</span>
        <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] text-cyan-300">
          #{stepLabel}
        </span>
      </button>
      <button
        type="button"
        onClick={exitTourMode}
        aria-label="Hide tour pill"
        title="Hide Return to /demo pill"
        className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}