// 🛡️ ONE SINGLE SOURCE OF TRUTH FOR IMPORTS
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

  const executeStakePayment = async (amount: number) => { /* Logic */ };

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};