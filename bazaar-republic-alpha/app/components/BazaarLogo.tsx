"use client";

import Image from "next/image";
import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export default function BazaarLogo({ size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "w-10 h-10 shadow-[0_0_10px_rgba(37,99,235,0.3)]",  // 40px
    md: "w-30 h-30 shadow-[0_0_20px_rgba(37,99,235,0.4)]",  // 120px
    lg: "w-48 h-48 shadow-[0_0_30px_rgba(37,99,235,0.5)]",  // 192px
  };

  // 🛡️ THE PAYLOAD MAP: Instructs the browser on exact bandwidth allocation
  const imageSizes = {
    sm: "40px",
    md: "120px",
    lg: "192px",
  };

  return (
    <div 
      className="relative flex items-center justify-center select-none pointer-events-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={`relative rounded-full overflow-hidden bg-slate-950 ${sizeClasses[size]}`}>
        <Image
          src="/bazaar-logo.png"
          alt="Bazaar Republic Identity"
          fill 
          priority
          draggable={false}
          sizes={imageSizes[size]} /* 🛡️ MESH-REPAIR: Injected payload coordinates */
          className="object-cover object-center" 
        />
      </div>
    </div>
  );
}