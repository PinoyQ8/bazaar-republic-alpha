"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";
// 🛡️ CRITICAL IMPORTS FOR SECTOR 1 PRODUCTION ENGINE
import * as StellarSdk from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

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
  executeStakePayment: (amount: number) => Promise<void>; 
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
  executeStakePayment: async () => {}, 
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

  // 🛡️ THE MESH BRIDGE: Declared in scope
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
      
      console.log("[MESH-STAKE] Fetching account details for UID:", pioneer.uid);
      const account = await server.getAccount(pioneer.uid);
      const contract = new StellarSdk.Contract(contractId);
      
      // 🛡️ Build the contract invocation operation
      const invokeOperation = contract.call(
        "stake", 
        StellarSdk.nativeToScVal(amount, { type: "i128" }),
        StellarSdk.nativeToScVal(pioneer.uid, { type: "address" })
      );

      const tx = new StellarSdk.TransactionBuilder(account, { 
        fee: "100000", // Standard Soroban fee buffer
        networkPassphrase 
      })
        .addOperation(invokeOperation)
        .setTimeout(30)
        .build();

      console.log("[MESH-STAKE] Simulating Soroban transaction...");
      const simulatedTx = await server.simulateTransaction(tx);
      
      if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) {
        throw new Error(`Soroban Simulation failed: ${simulatedTx.error}`);
      }

      const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulatedTx);
      const finalTx = assembledTx as unknown as StellarSdk.Transaction;

      console.log("[MESH-STAKE] Requesting signature from wallet provider...");
      const signResponse = await signTransaction(finalTx.toXDR(), { networkPassphrase });
      
      if (signResponse.error) {
        throw new Error(`Transaction signature rejected by user: ${signResponse.error}`);
      }

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signResponse.signedTxXdr, networkPassphrase);
      
      console.log("[MESH-STAKE] Broadcasting transaction to Soroban network...");
      const response = await server.sendTransaction(signedTx);

      if ((response.status as string) === "SUCCESS" || response.status === "PENDING") {
        console.log("[MESH-STAKE] 🟢 YIELD DELIVERED: Fuel successfully staked.");
        setPioneer((prev) => ({ 
          ...prev, 
          tier: "TIER-5-ACTIVE", 
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

export const useAuth = (): AuthContextType => useContext(AuthContext) ?? FALLBACK_AUTH;