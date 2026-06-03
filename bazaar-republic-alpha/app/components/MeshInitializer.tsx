"use client";

import { createContext, useContext, useEffect, useState } from "react";

const MeshContext = createContext<{ isPiReady: boolean }>({ isPiReady: false });

export function MeshInitializer({ children }: { children: React.ReactNode }) {
  const [isPiReady, setIsPiReady] = useState(false);

  useEffect(() => {
    const initializeMesh = () => {
      if (typeof window !== "undefined" && window.Pi) {
        try {
          window.Pi.init({ version: "2.0", sandbox: true });
          console.log("[MESH ALIGNMENT] Pi SDK v2.0 Initialized in Sandbox Mode");
          setIsPiReady(true);
        } catch (error) {
          console.error("[MESH-SCAN] SDK Initialization Fracture:", error);
        }
      }
    };

    const bootTimer = setTimeout(initializeMesh, 100);
    return () => clearTimeout(bootTimer);
  }, []);

  return (
    <MeshContext.Provider value={{ isPiReady }}>
      <div data-mesh-status={isPiReady ? "ONLINE" : "BOOTING"} className="contents">
        {children}
      </div>
    </MeshContext.Provider>
  );
}

// 🛡️ Hook for downstream components to read boot status
export const useMeshStatus = () => useContext(MeshContext);