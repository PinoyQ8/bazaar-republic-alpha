"use client"; // 🛡️ CRITICAL MESH-FIX: Required for Client Components and Context Providers in App Router

import { createContext, useContext, useState, ReactNode } from "react";

// 1. Interfaces
export interface PioneerState {
  username: string | undefined;
  uid: string | undefined;
  tier: string | undefined;
  role: string;
  trustScore: number;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

export interface AuthContextType {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: (data: PioneerState) => void;
  logout: () => void;
  executeStakePayment: (amount: number) => Promise<void>;
  isHydrated: boolean;
}

// 2. Context Initialization
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined,
    uid: undefined,
    tier: undefined,
    role: "CITIZEN",
    trustScore: 0,
    isAuthenticated: false,
    isHydrated: false,
  });

  const executeStakePayment = async (amount: number) => { 
    // 🛡️ Logic payload pending... 
  };

  const logout = () => setPioneer({
    username: undefined,
    uid: undefined,
    tier: undefined,
    role: "CITIZEN",
    trustScore: 0,
    isAuthenticated: false,
    isHydrated: true,
  });

  // 🛡️ DEFINE VALUE HERE TO SATISFY "VALUE NOT FOUND" ERROR
  const value: AuthContextType = {
    pioneer,
    setPioneer,
    login: (data: PioneerState) => setPioneer(data),
    logout,
    executeStakePayment,
    isHydrated: pioneer.isHydrated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Defensive Hook Execution
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    // 🛡️ BUILD-WORKER SHIELD: Bypasses the SSR prerender crash.
    // Returns a neutralized mock state instead of throwing an Error.
    return {
      pioneer: {
        username: undefined,
        uid: undefined,
        tier: undefined,
        role: "CITIZEN",
        trustScore: 0,
        isAuthenticated: false,
        isHydrated: false,
      },
      setPioneer: () => {},
      login: () => {},
      logout: () => {},
      executeStakePayment: async () => {},
      isHydrated: false,
    };
  }
  
  return context;
};