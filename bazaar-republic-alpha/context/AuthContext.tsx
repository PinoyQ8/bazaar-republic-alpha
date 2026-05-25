"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

// 🛡️ MESH TYPING: Define the strict architecture of a Pioneer session
export interface PioneerState {
  username: string | null;
  tier: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType {
  pioneer: PioneerState;
  login: (username: string, tier: string) => Promise<void>;
  logout: () => Promise<void>;
  isHydrated: boolean;
}

// Initialize the void state
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 🧠 THE E-NETWORK MEMORY CORE (SSOT)
 * Wraps the application to distribute the Pioneer's session state
 * instantly to all nested components without prop-drilling.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: null,
    tier: null,
    isAuthenticated: false,
  });

  // 🛡️ HYDRATION SEQUENCE: Restore state from the Uptime Shield cache on reload
  useEffect(() => {
    const cachedUser = localStorage.getItem("MESH_GENESIS_USER");
    const cachedTier = localStorage.getItem("MESH_TIER");

    if (cachedUser) {
      setPioneer({
        username: cachedUser,
        tier: cachedTier || "PIONEER",
        isAuthenticated: true,
      });
      console.log(`[MESH-SCAN] 🟢 State hydrated for node: ${cachedUser}`);
    }
    
    setIsHydrated(true);
  }, []);

  // 🔐 LOGIN HANDSHAKE: Invoked by Hero Sector after Adjudicator approval
  const login = async (username: string, tier: string) => {
    setPioneer({
      username,
      tier,
      isAuthenticated: true,
    });
    console.log(`[MESH-SCAN] 🔐 AuthContext SSOT locked for node: ${username}`);
  };

  // 🛑 MEMORY WIPE: Destroys local state and hits the API to kill the HttpOnly cookie
  const logout = async () => {
    console.log(`[MESH-SCAN] ⚠️ Initiating RAM flush for node: ${pioneer.username || "UNKNOWN"}`);
    
    // Purge UI State
    localStorage.clear();
    setPioneer({
      username: null,
      tier: null,
      isAuthenticated: false,
    });
    
    // Purge Server State
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("[MESH-SCAN] 🚨 API logout fracture detected.");
    }
    
    // Bounce to outer perimeter
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ pioneer, login, logout, isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 🛠️ THE BRIDGE: Custom Hook
 * Used by components (like the Dashboard and Vault) to tap into the SSOT.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider perimeter.");
  }
  return context;
}