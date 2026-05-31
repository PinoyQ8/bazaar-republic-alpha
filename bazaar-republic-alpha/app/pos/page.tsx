"use client"; // 🛡️ MESH-FIX: Enforce Client-Side Context

import React from "react";
import MerchantHUD from "@/app/components/MerchantHUD";
import { useAuth } from "@/context/AuthContext"; // Assuming this is here

export default function POSTerminalPage() {
   // ...
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 🛡️ RENDER THE ZERO-TRUST HUD */}
        <MerchantHUD />
      </div>
    </main>
  );
}