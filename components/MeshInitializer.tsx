"use client";

import { useEffect } from "react";

export function MeshInitializer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Intercept and suppress Pi SDK postMessage noise on local origins
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

    // 2. Safely initialize Pi SDK with dynamic sandbox flag
    const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
    const Pi = (window as any).Pi;

    if (Pi && typeof Pi.init === "function") {
      try {
        // Must be false inside Pi Browser to hook SDKMessaging natively
        Pi.init({
          version: "2.0",
          sandbox: !isPiBrowser,
        });
        console.log(`[MESH-INITIALIZER] Pi SDK initialized (isPiBrowser: ${isPiBrowser})`);
      } catch (err) {
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
