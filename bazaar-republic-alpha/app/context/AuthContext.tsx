"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { signTransaction } from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

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

// 🛡️ STATIC FALLBACK: Prevents memory churn on hook initialization
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
  const [pioneer, setPioneer] = useState<PioneerState>({
    username: undefined,
    uid: undefined,
    tier: undefined,
    role: "CITIZEN",
    trustScore: 0,
    isAuthenticated: false,
    isHydrated: false,
    accessToken: null,
  });

  // 🛡️ THE HYDRATION BRIDGE: Auto-authenticates node on mount
  useEffect(() => {
    const initializeNode = async () => {
      try {
        if (typeof window !== "undefined" && window.Pi) {
          const auth = await window.Pi.authenticate(['username', 'payments', 'wallet_address'], ['incomplete', 'approved']);
          
          setPioneer({
            username: auth.user.username,
            uid: auth.user.uid,
            tier: "TIER-1-NODE",
            role: "PIONEER",
            trustScore: 50,
            isAuthenticated: true,
            isHydrated: true,
            accessToken: auth.accessToken,
          });
          console.log("[MESH-SYNC] Pi SDK Authenticated Node:", auth.user.username);
        } else {
          // 🛡️ DEV BYPASS: Injects a safe 24-character MongoDB hex ID for local X570 testing
          console.warn("[MESH-SCAN] Pi SDK not found. Injecting Local Dev Node.");
          setPioneer({
            username: "PinoyQ8_Dev",
            uid: "5f9b3b9b9b9b9b9b9b9b9b9b", 
            tier: "TIER-ALPHA",
            role: "FOUNDER",
            trustScore: 99,
            isAuthenticated: true,
            isHydrated: true,
            accessToken: "DEV_ACCESS_TOKEN_OVERRIDE",
          });
        }
      } catch (error) {
        console.error("[MESH FRACTURE] Authentication failed:", error);
        setPioneer(prev => ({ ...prev, isHydrated: true })); 
      }
    };

    initializeNode();
  }, []);

  const executeStakePayment = async (amount: number): Promise<void> => {
    try {
      const contractId = process.env.NEXT_PUBLIC_MESH_CONTRACT_ID;
      if (!contractId || !pioneer.uid) throw new Error("Missing requirements.");

      const rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
      const server = new StellarSdk.rpc.Server(rpcUrl);
      const networkPassphrase = process.env.NEXT_PUBLIC_STELLAR_NETWORK || StellarSdk.Networks.TESTNET;
      
      const account = await server.getAccount(pioneer.uid);
      const contract = new StellarSdk.Contract(contractId);
      
      const invokeOperation = contract.call("stake", StellarSdk.nativeToScVal(pioneer.uid, { type: "address" }));
      const tx = new StellarSdk.TransactionBuilder(account, { fee: "20000000", networkPassphrase })
        .addOperation(invokeOperation)
        .setTimeout(30)
        .build();

      const simulatedTx = await server.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) throw new Error("Simulation failed.");

      const assembly = StellarSdk.rpc.assembleTransaction(tx, simulatedTx);
      const finalTx = assembly as unknown as StellarSdk.Transaction;

      const signResponse = await signTransaction(finalTx.toXDR(), { networkPassphrase });
      if (signResponse.error) throw new Error("Signature rejected.");

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signResponse.signedTxXdr, networkPassphrase);
      const response = await server.sendTransaction(signedTx);

      if ((response.status as string) === "SUCCESS") {
        setPioneer((prev) => ({ ...prev, tier: "TIER-5-ACTIVE", role: "PIONEER", trustScore: 100 }));
      } else {
        throw new Error("Transaction failed.");
      }
    } catch (error) {
      console.error("[MESH-SCAN] Execution Fracture:", error);
      throw error;
    }
  };

  const login = (data: PioneerState) => setPioneer(data);

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

  // 🛡️ MEMOIZED CONTEXT VALUE: Prevents unnecessary Provider re-renders
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