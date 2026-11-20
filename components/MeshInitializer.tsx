"use client";

import { useEffect } from "react";

export function MeshInitializer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const suppressCrossOriginWarning = (event: ErrorEvent) => {
      if (
        event.message &&
        (event.message.includes("postMessage") ||
          event.message.includes("target origin") ||
          event.message.includes("Messaging promise"))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };
    window.addEventListener("error", suppressCrossOriginWarning, true);

    const w = window as any;
    const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);

    if (w.Pi && typeof w.Pi.init === "function" && !w.__PI_INITIALIZED__) {
      try {
        w.Pi.init({
          version: "2.0",
          sandbox: !isPiBrowser,
        });
        w.__PI_INITIALIZED__ = true;
        console.log(`[MESH-INITIALIZER] Pi SDK initialized (isPiBrowser: ${isPiBrowser})`);
      } catch (err) {
        w.__PI_INITIALIZED__ = true;
        console.warn("[MESH-INITIALIZER] Pi.init caught:", err);
      }
    }

    return () => {
      window.removeEventListener("error", suppressCrossOriginWarning, true);
    };
  }, []);

  return null;
}

export default MeshInitializer;
