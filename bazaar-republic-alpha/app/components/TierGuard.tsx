// components/TierGuard.tsx
"use client";

import React from "react";
// components/TierGuard.tsx
import { useAuth, PioneerState } from "@/context/AuthContext";

interface TierGuardProps {
  children: React.ReactNode;
  allowedTiers: string[]; // e.g., ["ELDER", "ADMIN"]
  fallback?: React.ReactNode; // Optional: what to show if denied
}

/**
 * 🛡️ THE RBAC LOGIC GATE
 * Prevents unauthorized nodes from rendering sensitive E-Network sectors.
 */
export function TierGuard({ children, allowedTiers, fallback = null }: TierGuardProps) {
  const { pioneer, isHydrated } = useAuth();

  // 🛡️ LOADING STATE: Wait for Hydration to avoid UI flickering
  if (!isHydrated) return null;

  // 🛑 DENIAL LOGIC: Check if user is auth'd and has valid tier
  if (!pioneer.isAuthenticated || !pioneer.tier || !allowedTiers.includes(pioneer.tier)) {
    return <>{fallback}</>;
  }

  // ✅ PERMITTED: Render the sector
  return <>{children}</>;
}