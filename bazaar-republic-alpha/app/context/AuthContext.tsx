"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";
// 🛡️ CRITICAL IMPORTS FOR SECTOR 1 PRODUCTION ENGINE
import * as StellarSdk from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

// ----------------------------------------------------------------------
// 🛡️ SCHEMA v2.3: Type Alignment 
// ----------------------------------------------------------------------
export type NodeTier = "CITIZEN" | "NOVICE" | "ACADEMY_CORE" | "MESH_GUARDIAN" | "BAZAAR_FOUNDER";
export type NodeStatus = "SYNCING" | "ACTIVE" | "FROZEN" | "SUSPENDED";

// 🛡️ MESH INTERFACE: Hardened Contract
export interface PioneerState {
  username: string | undefined;
  uid: string | undefined;
  tier: NodeTier;        // 🛡️ SCHEMA v2.3 UPGRADE
  status: NodeStatus;    // 🛡️ SCHEMA v2.3 UPGRADE
  role: string;
  trustScore: number;
  isAuthenticated: boolean;
  isHydrated: boolean;
  accessToken: string | null;
}

export interface AuthContextType {
  pioneer: PioneerState;
  setPioneer: React.Dispatch<React.SetStateAction<PioneerState>>;
  login: (data: Partial<PioneerState>) => void;
  logout: () => void;
  executeStakePayment: (amount: number) => Promise<void>; 
  isHydrated: boolean;
  accessToken: string | null;
}

// 🛡️ STATIC FALLBACK
const FALLBACK_AUTH: AuthContextType = {
  pioneer: { 
    username: undefined, 
    uid: undefined, 
    tier: "CITIZEN", 
    status: "SYNCING", 
    role: "CITIZEN", 
    trustScore: 0, 
    isAuthenticated: false, 
    isHydrated: false, 
    accessToken: null 
  },
  setPioneer: () => {},
  login: () => {},
  logout: () => {},
  executeStakePayment: async () => {}, 
  isHydrated: false,
  accessToken: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 🛡️ PERSISTENT HYDRATION: Check localStorage immediately on mount
  const [pioneer, setPioneer] = useState<PioneerState>(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedUser = localStorage.getItem("pi_auth_user");
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          return {
            username: parsed.username,
            uid: parsed.uid,
            tier: parsed.tier || "CITIZEN",
            status: parsed.status || "ACTIVE", // Defaults to ACTIVE if they were previously cached
            role: "PIONEER",
            trustScore: parsed.trustScore || 100,
            isAuthenticated: true,
            isHydrated: true,
            accessToken: "CACHED_SESSION_TOKEN"
          };
        }
      } catch (e) {
        console.error("[MESH-AUTH] Failed to read cached pioneer session", e);
      }
    }
    return FALLBACK_AUTH.pioneer;
  });

  const login = (data: Partial<PioneerState>) => {
    setPioneer((prev) => ({ 
      ...prev, 
      ...data, 
      isHydrated: true 
    }));
  };

  const logout = (): void => {
    // 🛡️ SCHEMA v2.3 PURGE
    localStorage.removeItem("pi_auth_user");
    localStorage.removeItem("mesh_pioneer_active");
    localStorage.removeItem("mesh_pioneer_uid");
    localStorage.removeItem("mesh_pioneer_username");
    localStorage.removeItem("mesh_pioneer_status");
    localStorage.removeItem("mesh_pioneer_tier");
    
    setPioneer(FALLBACK_AUTH.pioneer);
  };

  // 🛡️ SECTOR 1 PRODUCTION ENGINE: Soroban Smart Contract Fuel Staker
  const executeStakePayment = async (amount: number): Promise<void> => {
    try {
      const contractId = process.env.NEXT_PUBLIC_MESH_CONTRACT_ID;
      if (!contractId || !pioneer.uid) {
        throw new Error("Missing MESH contract ID or Pioneer identity credentials.");
      }

      const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
      const server = new StellarSdk.rpc.Server(rpcUrl);
      const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK || StellarSdk.Networks.TESTNET;
      
      const account = await server.getAccount(pioneer.uid);
      const contract = new StellarSdk.Contract(contractId);
      
      const invokeOperation = contract.call(
        "stake", 
        StellarSdk.nativeToScVal(amount, { type: "i128" }),
        StellarSdk.nativeToScVal(pioneer.uid, { type: "address" })
      );

      const tx = new StellarSdk.TransactionBuilder(account, { 
        fee: "100000",
        networkPassphrase 
      })
        .addOperation(invokeOperation)
        .setTimeout(30)
        .build();

      const simulatedTx = await server.simulateTransaction(tx);
      
      if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) {
        throw new Error(`Soroban Simulation failed: ${simulatedTx.error}`);
      }

      const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulatedTx);
      const finalTx = assembledTx as unknown as StellarSdk.Transaction;

      const signResponse = await signTransaction(finalTx.toXDR(), { networkPassphrase });
      
      if (signResponse.error) {
        throw new Error(`Transaction signature rejected by user: ${signResponse.error}`);
      }

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signResponse.signedTxXdr, networkPassphrase);
      const response = await server.sendTransaction(signedTx);

      if ((response.status as string) === "SUCCESS" || response.status === "PENDING") {
        setPioneer((prev) => ({ 
          ...prev, 
          tier: "MESH_GUARDIAN", // 🛡️ Aligned with Schema v2.3 NodeTier
          trustScore: Math.min((prev.trustScore || 50) + 10, 100) 
        }));
      } else {
        throw new Error(`Transaction broadcast failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("[MESH-SCAN] Execution Fracture in executeStakePayment:", error);
      throw error;
    }
  };

  const contextValue = useMemo(() => ({
    pioneer,
    setPioneer,
    login,
    logout,
    executeStakePayment, 
    isHydrated: pioneer.isHydrated,
    accessToken: pioneer.accessToken
  }), [pioneer]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 🛡️ DUAL EXPORT BRIDGE
export const useAuth = (): AuthContextType => useContext(AuthContext) ?? FALLBACK_AUTH;
export default useAuth;