// Location: app/dashboard/layout.tsx
import React from "react";
import BiometricUnlockGate from "@/components/BiometricUnlockGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BiometricUnlockGate>
      <section className="w-full flex-1">
        {children}
      </section>
    </BiometricUnlockGate>
  );
}