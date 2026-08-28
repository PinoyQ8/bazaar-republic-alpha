// app/academy/protocol-forge/layout.tsx
import React from "react";

export default function ProtocolForgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="protocol-forge-node min-h-full">
      {children}
    </div>
  );
}