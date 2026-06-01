'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PioneerState {
  username: string | undefined;
  uid: string | undefined; // 🛡️ Added to resolve HUD error
  tier: string | undefined;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

interface AuthContextType {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: () => void;
  executeStakePayment: (amount: number, memo: string) => void;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined,
    uid: undefined,
    tier: undefined,
    isAuthenticated: false,
    isHydrated: false,
  });

  const login = () => {};
  const executeStakePayment = (amount: number, memo: string) => {};

  return (
    <AuthContext.Provider value={{ pioneer, setPioneer, login, executeStakePayment, isHydrated: pioneer.isHydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🛡️ MESH-FIX: The fallback object now contains EVERY property in AuthContextType
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    return {
      pioneer: { 
        username: "NODE_OFFLINE", 
        uid: undefined, 
        tier: "NONE", 
        isAuthenticated: false, 
        isHydrated: false 
      },
      setPioneer: () => {},
      login: () => {},
      executeStakePayment: () => {}, // 🛡️ Now included
      isHydrated: false
    };
  }
  return context;
};