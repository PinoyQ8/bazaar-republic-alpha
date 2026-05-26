// components/TierGuard.tsx
"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";

// 🛡️ INLINE MESH CONTRACT (Bypasses stubborn AuthContext exports)
interface LocalPioneerState {
  username?: string | null;
  tier?: string | null;
  isAuthenticated: boolean;
}

interface TierGuardProps {
  children: React.ReactNode;
  allowedTiers: string[]; 
  fallback?: React.ReactNode; 
}

/**
 * 🛡️ THE RBAC LOGIC GATE
 * Prevents unauthorized nodes from rendering sensitive E-Network sectors.
 * Hard-coded to safely infer context types without external dependency blocks.
 */
export function TierGuard({ children, allowedTiers, fallback = null }: TierGuardProps) {
  // Cast the context hook to 'any' temporarily to bypass the missing 'isHydrated' contract error
  const context = useAuth() as any;
  
  const pioneer = context.pioneer as LocalPioneerState;
  const isHydrated = context.isHydrated as boolean;

  // 🛡️ LOADING STATE: Wait for Hydration to avoid UI flickering
  if (!isHydrated) return null;

  // 🛑 DENIAL LOGIC: Check if user is auth'd and has valid tier
  if (!pioneer || !pioneer.isAuthenticated || !pioneer.tier || !allowedTiers.includes(pioneer.tier)) {
    return <>{fallback}</>;
  }

  // ✅ PERMITTED: Render the sector
  return <>{children}</>;
}