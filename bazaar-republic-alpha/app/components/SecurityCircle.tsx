"use client";

import { useMeshStatus } from "@/app/components/MeshInitializer";
import SecurityCircleHUD from "./SecurityCircleHUD";

export default function SecurityCircle() {
  const { user, isPiReady } = useMeshStatus();

  if (!isPiReady || !user) {
    return (
      <div className="p-4 border border-zinc-800 bg-zinc-950/50 rounded-md text-zinc-500 font-mono text-sm">
        [MESH-SCAN] Awaiting Auth Context...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🛡️ PIONEER IDENTITY ANCHORED: Passed to HUD via Props */}
      <SecurityCircleHUD pioneerId={user.uid} />
    </div>
  );
}