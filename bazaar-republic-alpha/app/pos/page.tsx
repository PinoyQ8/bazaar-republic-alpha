import React from "react";
import MerchantHUD from "@/components/MerchantHUD"; // Adjust this path if your components folder is elsewhere

export default function POSTerminalPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 🛡️ RENDER THE ZERO-TRUST HUD */}
        <MerchantHUD />
      </div>
    </main>
  );
}