"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";

// 🛡️ MESH INTERFACE: Hardened Contract
export interface PioneerState {
  username: string | undefined;
  uid: string | undefined;
  tier: string | undefined;
  role: string;
  trustScore: number;
  isAuthenticated: boolean;
  isHydrated: boolean;
  accessToken: string | null;
}

export interface AuthContextType {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: (data: PioneerState) => void;
  logout: () => void;
  executeStakePayment: (amount: number) => Promise<void>; // 🛡️ RESTORED STUB
  isHydrated: boolean;
  accessToken: string | null;
}

// 🛡️ STATIC FALLBACK
const FALLBACK_AUTH: AuthContextType = {
  pioneer: { 
    username: undefined, uid: undefined, tier: undefined, role: "CITIZEN", 
    trustScore: 0, isAuthenticated: false, isHydrated: false, accessToken: null 
  },
  setPioneer: () => {},
  login: () => {},
  logout: () => {},
  executeStakePayment: async () => {}, // 🛡️ RESTORED STUB
  isHydrated: false,
  accessToken: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 🛡️ PERSISTENT HYDRATION: Check localStorage immediately on mount to prevent amnesia
  const [pioneer, setPioneer] = useState<PioneerState>(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedUser = localStorage.getItem("pi_auth_user");
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          return {
            username: parsed.username,
            uid: parsed.uid,
            tier: "TIER-1-NODE",
            role: "PIONEER",
            trustScore: 100,
            isAuthenticated: true,
            isHydrated: true,
            accessToken: "CACHED_SESSION_TOKEN"
          };
        }
      } catch (e) {
        console.error("[MESH-AUTH] Failed to read cached pioneer session", e);
      }
    }
    return {
      username: undefined,
      uid: undefined,
      tier: undefined,
      role: "CITIZEN",
      trustScore: 0,
      isAuthenticated: false,
      isHydrated: true, // Mark hydrated immediately
      accessToken: null,
    };
  });

  // 🛡️ THE MESH BRIDGE: Declared in scope to resolve Error 18004
  const login = (data: PioneerState) => {
    setPioneer({ ...data, isHydrated: true });
  };

  const logout = (): void => {
    setPioneer({
      username: undefined,
      uid: undefined,
      tier: undefined,
      role: "CITIZEN",
      trustScore: 0,
      isAuthenticated: false,
      isHydrated: true,
      accessToken: null,
    });
  };

  // 🛡️ HOLLOW STUB: Appeases TS compiler without interfering with Pi SDK
  const executeStakePayment = async (amount: number): Promise<void> => {
    console.warn("[MESH-BRIDGE] executeStakePayment is temporarily bypassed for Pi SDK native testing.");
  };

  const contextValue = useMemo(() => ({
    pioneer,
    setPioneer,
    login,
    logout,
    executeStakePayment, // 🛡️ RESTORED STUB
    isHydrated: pioneer.isHydrated,
    accessToken: pioneer.accessToken
  }), [pioneer]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => useContext(AuthContext) ?? FALLBACK_AUTH;